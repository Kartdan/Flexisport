const express = require("express");
const Tournament = require("../models/Tournament");
const TournamentQuestion = require("../models/TournamentQuestion");
const TournamentQuestionAnswer = require("../models/TournamentQuestionAnswer");
const Notification = require("../models/Notification");
const { verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

async function notifyRegisteredPlayersAboutTournamentUpdate(tournament, actorUserId) {
  const participantIds = (tournament.registeredParticipants || [])
    .map((id) => id.toString())
    .filter((id) => id !== actorUserId);

  if (participantIds.length === 0) return;

  const notifications = participantIds.map((userId) => ({
    user: userId,
    type: "tournament_details_updated",
    title: "Tournament details updated",
    message: `The tournament \"${tournament.name}\" was updated. Check the latest details.`,
    tournament: tournament._id,
    isRead: false
  }));

  await Notification.insertMany(notifications);
}

router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Only owners can create tournaments" });
    }

    const tournament = new Tournament({
      ...req.body,
      author: req.user.id
    });

    const savedTournament = await tournament.save();
    const populatedTournament = await savedTournament.populate("author court");
    res.json(populatedTournament);
  } catch (err) {
    console.error("Error creating tournament:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to create tournament" });
  }
});

router.get("/", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    
    const filter = {
      $or: [
        { publicationStatus: "published" },
        { publicationStatus: { $exists: false } }
      ]
    };
    if (req.query.court) filter.court = req.query.court;
    if (req.query.sport) filter.sport = req.query.sport;
    if (req.query.status) filter.status = req.query.status;

    const tournaments = await Tournament.find(filter)
      .populate("author", "fullName username")
      .populate("court", "name address")
      .sort({ startDate: -1 });
    
    res.json(tournaments);
  } catch (err) {
    console.error("Error fetching tournaments:", err);
    res.status(500).json({ error: "Failed to fetch tournaments" });
  }
});

router.get("/admin/list", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "supervisor") {
      return res.status(403).json({ error: "Only administrators or supervisors can access this" });
    }

    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    const filter = {};
    if (req.query.court) filter.court = req.query.court;
    if (req.query.sport) filter.sport = req.query.sport;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.publicationStatus) filter.publicationStatus = req.query.publicationStatus;

    const tournaments = await Tournament.find(filter)
      .populate("author", "fullName username")
      .populate("court", "name address")
      .sort({ startDate: -1 });

    res.json(tournaments);
  } catch (err) {
    console.error("Error fetching moderator tournaments:", err);
    res.status(500).json({ error: "Failed to fetch tournaments" });
  }
});

router.patch("/:id/publication-status", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "supervisor") {
      return res.status(403).json({ error: "Only administrators or supervisors can moderate tournaments" });
    }

    const nextStatus = (req.body.publicationStatus || "").trim();
    const allowedStatuses = ["published", "unpublished", "suspended"];
    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({ error: "Invalid publication status" });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    const previousStatus = tournament.publicationStatus || "published";
    tournament.publicationStatus = nextStatus;
    const updatedTournament = await tournament.save();

    if (previousStatus !== nextStatus && tournament.author.toString() !== req.user.id) {
      const labels = {
        published: "Published",
        unpublished: "Unpublished",
        suspended: "Suspended"
      };

      await Notification.create({
        user: tournament.author,
        type: "tournament_publication_status",
        title: "Tournament visibility updated",
        message: `Your tournament \"${tournament.name}\" is now ${labels[nextStatus] || nextStatus}.`,
        tournament: tournament._id,
        isRead: false
      });
    }

    const populatedTournament = await updatedTournament.populate([
      { path: "author", select: "fullName username" },
      { path: "court", select: "name address" },
      { path: "registeredParticipants", select: "fullName username" }
    ]);

    res.json(populatedTournament);
  } catch (err) {
    console.error("Error moderating tournament publication status:", err);
    res.status(500).json({ error: "Failed to update publication status" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate("author", "fullName username email")
      .populate("court", "name address phone")
      .populate("registeredParticipants", "fullName username");
    
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    
    res.json(tournament);
  } catch (err) {
    console.error("Error fetching tournament:", err);
    res.status(500).json({ error: "Failed to fetch tournament" });
  }
});

router.get("/:id/questions", async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    const questions = await TournamentQuestion.find({
      tournament: req.params.id,
      visibility: "public"
    })
      .sort({ createdAt: -1 })
      .populate("askedBy", "fullName username")
      .populate("court", "name");

    res.json(questions);
  } catch (err) {
    console.error("Error fetching tournament questions:", err);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

router.post("/:id/questions", verifyToken, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    if (tournament.publicationStatus && tournament.publicationStatus !== "published") {
      return res.status(400).json({ error: "Questions are disabled for unpublished or suspended tournaments" });
    }

    const questionText = (req.body.question || "").trim();
    if (!questionText) {
      return res.status(400).json({ error: "Question cannot be empty" });
    }

    const question = new TournamentQuestion({
      tournament: tournament._id,
      court: tournament.court,
      askedBy: req.user.id,
      question: questionText,
      visibility: "public",
      status: "open"
    });

    const savedQuestion = await question.save();
    const populatedQuestion = await savedQuestion.populate("askedBy", "fullName username");

    if (tournament.author.toString() !== req.user.id) {
      await Notification.create({
        user: tournament.author,
        type: "tournament_question",
        title: "New tournament question",
        message: `A user asked a new question on ${tournament.name}.`,
        tournament: tournament._id,
        question: savedQuestion._id,
        isRead: false
      });
    }

    res.status(201).json(populatedQuestion);
  } catch (err) {
    console.error("Error creating tournament question:", err);
    res.status(500).json({ error: "Failed to submit question" });
  }
});

router.patch("/:id/questions/:questionId", verifyToken, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    const question = await TournamentQuestion.findOne({
      _id: req.params.questionId,
      tournament: req.params.id
    });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const canEdit = question.askedBy.toString() === req.user.id;

    if (!canEdit) {
      return res.status(403).json({ error: "Only the question author can edit this question" });
    }

    const nextQuestionText = (req.body.question || "").trim();
    if (!nextQuestionText) {
      return res.status(400).json({ error: "Question cannot be empty" });
    }

    question.question = nextQuestionText;
    const updatedQuestion = await question.save();
    const populatedQuestion = await updatedQuestion.populate("askedBy", "fullName username");

    res.json(populatedQuestion);
  } catch (err) {
    console.error("Error editing question:", err);
    res.status(500).json({ error: "Failed to edit question" });
  }
});

router.get("/:id/questions/:questionId/answers", async (req, res) => {
  try {
    const question = await TournamentQuestion.findOne({
      _id: req.params.questionId,
      tournament: req.params.id
    });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const answers = await TournamentQuestionAnswer.find({ question: req.params.questionId })
      .sort({ createdAt: 1 })
      .populate("answeredBy", "fullName username");

    const response = answers.map(a => ({
      ...a.toObject(),
      questionId: a.question
    }));

    res.json(response);
  } catch (err) {
    console.error("Error fetching question answers:", err);
    res.status(500).json({ error: "Failed to fetch answers" });
  }
});

router.post("/:id/questions/:questionId/answers", verifyToken, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    if (tournament.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only tournament owner can answer questions" });
    }

    const question = await TournamentQuestion.findOne({
      _id: req.params.questionId,
      tournament: req.params.id
    });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const answerText = (req.body.answer || "").trim();
    if (answerText.length < 2) {
      return res.status(400).json({ error: "Answer must be at least 2 characters long" });
    }

    const answer = new TournamentQuestionAnswer({
      question: question._id,
      tournament: tournament._id,
      court: tournament.court,
      answeredBy: req.user.id,
      answer: answerText,
      isOwnerResponse: true
    });

    const savedAnswer = await answer.save();
    await TournamentQuestion.findByIdAndUpdate(question._id, { status: "answered" });

    if (question.askedBy.toString() !== req.user.id) {
      await Notification.create({
        user: question.askedBy,
        type: "tournament_answer",
        title: "Your question was answered",
        message: `An owner answered your question on ${tournament.name}.`,
        tournament: tournament._id,
        question: question._id,
        isRead: false
      });
    }

    const populatedAnswer = await savedAnswer.populate("answeredBy", "fullName username");

    res.status(201).json({
      ...populatedAnswer.toObject(),
      questionId: savedAnswer.question
    });
  } catch (err) {
    console.error("Error creating answer:", err);
    res.status(500).json({ error: "Failed to submit answer" });
  }
});

router.patch("/:id/questions/:questionId/answers/:answerId", verifyToken, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    const answer = await TournamentQuestionAnswer.findOne({
      _id: req.params.answerId,
      question: req.params.questionId,
      tournament: req.params.id
    });

    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    const canEdit = answer.answeredBy.toString() === req.user.id;

    if (!canEdit) {
      return res.status(403).json({ error: "Only the answer author can edit this answer" });
    }

    const nextAnswerText = (req.body.answer || "").trim();
    if (nextAnswerText.length < 2) {
      return res.status(400).json({ error: "Answer must be at least 2 characters long" });
    }

    answer.answer = nextAnswerText;
    const updatedAnswer = await answer.save();
    const populatedAnswer = await updatedAnswer.populate("answeredBy", "fullName username");

    res.json({
      ...populatedAnswer.toObject(),
      questionId: updatedAnswer.question
    });
  } catch (err) {
    console.error("Error editing answer:", err);
    res.status(500).json({ error: "Failed to edit answer" });
  }
});

router.get("/my/list", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Only owners can access this" });
    }

    res.set("Cache-Control", "no-store");
    const tournaments = await Tournament.find({ author: req.user.id })
      .populate("court", "name address")
      .populate("registeredParticipants", "fullName username email")
      .sort({ createdAt: -1 });
    
    res.json(tournaments);
  } catch (err) {
    console.error("Error fetching tournaments:", err);
    res.status(500).json({ error: "Failed to fetch tournaments" });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    if (tournament.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only owner can update tournament" });
    }

    const previousSnapshot = JSON.stringify({
      name: tournament.name,
      sport: tournament.sport,
      description: tournament.description,
      format: tournament.format,
      experienceLevel: tournament.experienceLevel,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      registrationDeadline: tournament.registrationDeadline,
      maxParticipants: tournament.maxParticipants,
      entryFee: tournament.entryFee,
      prizes: tournament.prizes,
      status: tournament.status,
      court: tournament.court?.toString()
    });

    Object.assign(tournament, req.body);
    const updatedTournament = await tournament.save();

    const nextSnapshot = JSON.stringify({
      name: updatedTournament.name,
      sport: updatedTournament.sport,
      description: updatedTournament.description,
      format: updatedTournament.format,
      experienceLevel: updatedTournament.experienceLevel,
      startDate: updatedTournament.startDate,
      endDate: updatedTournament.endDate,
      registrationDeadline: updatedTournament.registrationDeadline,
      maxParticipants: updatedTournament.maxParticipants,
      entryFee: updatedTournament.entryFee,
      prizes: updatedTournament.prizes,
      status: updatedTournament.status,
      court: updatedTournament.court?.toString()
    });

    if (previousSnapshot !== nextSnapshot) {
      await notifyRegisteredPlayersAboutTournamentUpdate(updatedTournament, req.user.id);
    }

    const populatedTournament = await updatedTournament.populate("author court");
    
    res.json(populatedTournament);
  } catch (err) {
    console.error("Error updating tournament:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to update tournament" });
  }
});

router.post("/:id/cover-photo", verifyToken, upload.single("coverPhoto"), async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    if (tournament.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only owner can update tournament" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No cover photo provided" });
    }

    const base64 = req.file.buffer.toString("base64");
    tournament.coverPhoto = `data:${req.file.mimetype};base64,${base64}`;

    const updatedTournament = await tournament.save();
    await notifyRegisteredPlayersAboutTournamentUpdate(updatedTournament, req.user.id);
    const populatedTournament = await updatedTournament.populate("author court");

    res.json(populatedTournament);
  } catch (err) {
    console.error("Error uploading cover photo:", err);
    res.status(500).json({ error: "Failed to upload cover photo" });
  }
});

router.delete("/:id/cover-photo", verifyToken, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    if (tournament.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only owner can update tournament" });
    }

    tournament.coverPhoto = "";
    const updatedTournament = await tournament.save();
    await notifyRegisteredPlayersAboutTournamentUpdate(updatedTournament, req.user.id);
    const populatedTournament = await updatedTournament.populate("author court");

    res.json(populatedTournament);
  } catch (err) {
    console.error("Error deleting cover photo:", err);
    res.status(500).json({ error: "Failed to delete cover photo" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    if (tournament.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only owner can delete tournament" });
    }

    await Tournament.findByIdAndDelete(req.params.id);
    res.json({ message: "Tournament deleted successfully" });
  } catch (err) {
    console.error("Error deleting tournament:", err);
    res.status(500).json({ error: "Failed to delete tournament" });
  }
});

router.post("/:id/register", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "player") {
      return res.status(403).json({ error: "Only players can register for tournaments" });
    }

    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    if (tournament.publicationStatus && tournament.publicationStatus !== "published") {
      return res.status(400).json({ error: "This tournament is not available for registration" });
    }

    if (tournament.registeredParticipants.includes(req.user.id)) {
      return res.status(400).json({ error: "Already registered for this tournament" });
    }

    if (tournament.registeredParticipants.length >= tournament.maxParticipants) {
      return res.status(400).json({ error: "Tournament is full" });
    }

    if (new Date() > tournament.registrationDeadline) {
      return res.status(400).json({ error: "Registration deadline has passed" });
    }

    tournament.registeredParticipants.push(req.user.id);
    const updatedTournament = await tournament.save();
    const populatedTournament = await updatedTournament.populate("registeredParticipants", "fullName username");
    
    res.json(populatedTournament);
  } catch (err) {
    console.error("Error registering for tournament:", err);
    res.status(500).json({ error: "Failed to register for tournament" });
  }
});

router.post("/:id/unregister", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "player") {
      return res.status(403).json({ error: "Only players can unregister from tournaments" });
    }

    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    tournament.registeredParticipants = tournament.registeredParticipants.filter(
      id => id.toString() !== req.user.id
    );

    const updatedTournament = await tournament.save();
    const populatedTournament = await updatedTournament.populate("registeredParticipants", "fullName username");
    
    res.json(populatedTournament);
  } catch (err) {
    console.error("Error unregistering from tournament:", err);
    res.status(500).json({ error: "Failed to unregister from tournament" });
  }
});

module.exports = router;
