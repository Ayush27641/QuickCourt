require('dotenv').config();

const express = require('express');
const cors = require('cors');

const prisma = require('./db/prisma');

const { createRoutes } = require('./routes');

const BookingRepository = require('./repositories/BookingRepository');
const FacilityEarningsRepository = require('./repositories/FacilityEarningsRepository');
const VenueRepository = require('./repositories/VenueRepository');
const SportRepository = require('./repositories/SportRepository');
const CommentRepository = require('./repositories/CommentRepository');
const FacilityOwnerProfileRepository = require('./repositories/FacilityOwnerProfileRepository');
const RefundRepository = require('./repositories/RefundRepository');
const UserRepository = require('./repositories/UserRepository');
const GameRepository = require('./repositories/GameRepository');
const UserGameProfileRepository = require('./repositories/UserGameProfileRepository');
const RoomRepository = require('./repositories/RoomRepository');

const BookingService = require('./services/BookingService');
const VenueService = require('./services/VenueService');
const SportService = require('./services/SportService');
const CommentService = require('./services/CommentService');
const RefundModelService = require('./services/RefundModelService');
const UserRegistrationService = require('./services/UserRegistrationService');
const JoinGameService = require('./services/JoinGameService');
const RoomService = require('./services/RoomService');
const ChatService = require('./services/ChatService');
const JwtService = require('./services/JwtService');
const EmailService = require('./services/EmailService');

const BCryptPasswordEncoder = require('./auth/BCryptPasswordEncoder');
const AuthenticationManager = require('./auth/AuthenticationManager');

let _deps = null;

function createApp() {
  const app = express();

  app.use(cors({ origin: '*'}));
  app.use(express.json({ limit: '2mb' }));

  // --- Prisma repositories ---
  const bookingRepository = BookingRepository(prisma);
  const facilityEarningsRepository = FacilityEarningsRepository(prisma);
  const venueRepository = VenueRepository(prisma);
  const sportRepository = SportRepository(prisma);
  const commentRepository = CommentRepository(prisma);
  const facilityOwnerProfileRepository = FacilityOwnerProfileRepository(prisma);
  const refundRepository = RefundRepository(prisma);
  const userRepository = UserRepository(prisma);
  const gameRepository = GameRepository(prisma);
  const userGameProfileRepository = UserGameProfileRepository(prisma);
  const roomRepository = RoomRepository(prisma);

  // --- Infra services ---
  // For now, EmailService expects a mailSender with .send(). Provide a stub.
  const mailSender = { send: async () => true };
  const emailService = EmailService(mailSender);

  const refundService = RefundModelService(refundRepository, emailService, bookingRepository);

  const bookingService = BookingService(
    bookingRepository,
    facilityEarningsRepository,
    emailService,
    refundService,
    prisma
  );

  const venueService = VenueService(venueRepository, facilityOwnerProfileRepository);
  const sportService = SportService(sportRepository, venueRepository, commentRepository);
  const commentService = CommentService(commentRepository, sportRepository);

  const joinGameService = JoinGameService(gameRepository, userGameProfileRepository);

  const roomService = RoomService(roomRepository);
  const chatService = ChatService(roomService);

  const bCryptPasswordEncoder = BCryptPasswordEncoder(12);
  const authenticationManager = AuthenticationManager(userRepository, bCryptPasswordEncoder);

  const jwtSecret = process.env.JWT_SECRET_BASE64 || '';
  const jwtService = JwtService(jwtSecret);

  const deps = {
    bookingService,
    earningsRepository: facilityEarningsRepository,

    facilityEarningsRepository,

    roomService,
    chatService,

    commentService,
    sportService,
    venueService,

    joinGameService,

    refundService,

    userRegistrationService: UserRegistrationService(userRepository, emailService, facilityOwnerProfileRepository),
    authenticationManager,
    jwtService,
    bCryptPasswordEncoder,

    // ollamaService not wired here
  };

  app.use('/', createRoutes(deps));

  _deps = deps;

  // Basic error handler
  app.use((err, req, res, next) => {
    void next;
    const status = err?.status ?? 500;
    return res.status(status).json({ message: String(err?.message ?? 'Internal Server Error') });
  });

  return app;
}

function getDeps() {
  return _deps;
}

module.exports = { createApp, getDeps };
