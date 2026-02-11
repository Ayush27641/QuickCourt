const express = require('express');

/**
 * Java equivalent: UserRegistrationController
 *
 * Notes:
 * - Java uses @CrossOrigin("*") so the wiring layer should enable CORS.
 * - Java uses Spring Security AuthenticationManager + BCrypt + JwtService.
 *   This controller keeps the same endpoint names/params and delegates auth/token work
 *   to injected dependencies.
 */
function UserRegistrationController(
  userRegistrationService,
  authenticationManager,
  jwtService,
  bCryptPasswordEncoder
) {
  const router = express.Router();

  async function register(req, res, next) {
    try {
      const userRegistrationModel = req.body;

      const userRegistration2 = await userRegistrationService.findRegistrationByUsername(
        userRegistrationModel?.email ?? userRegistrationModel?.getEmail?.()
      );

      if (userRegistration2 != null) {
        // Optional semantics: Java checks isPresent(); treat non-null as present here.
        const isPresent =
          userRegistration2.isPresent?.() ??
          (typeof userRegistration2 === 'object' && 'present' in userRegistration2
            ? Boolean(userRegistration2.present)
            : true);

        if (isPresent) {
          return res.status(400).send('Username is already in use');
        }
      }

      const password =
        userRegistrationModel?.password ?? userRegistrationModel?.getPassword?.();

      const encodedPassword = bCryptPasswordEncoder.encode
        ? await bCryptPasswordEncoder.encode(password)
        : password;

      if (userRegistrationModel?.setPassword) {
        userRegistrationModel.setPassword(encodedPassword);
      } else {
        userRegistrationModel.password = encodedPassword;
      }

      const userRegistrationModel1 = await userRegistrationService.register(
        userRegistrationModel
      );

      if (userRegistrationModel1 != null) {
        return res.sendStatus(200);
      }

      return res.status(500).send('Could not register user');
    } catch (err) {
      return next(err);
    }
  }

  async function login(req, res, next) {
    try {
      const email = req.query.email;
      const password = req.query.password;

      const authentication = await authenticationManager.authenticate(email, password);

      const isAuthenticated =
        authentication?.isAuthenticated?.() ?? Boolean(authentication?.authenticated);

      if (isAuthenticated) {
        const s = await jwtService.generateToken(email);
        console.log(s);
        return res.status(200).json(s);
      }

      return res
        .status(400)
        .send('Either Wrong credentials or Internal server error ');
    } catch (err) {
      return next(err);
    }
  }

  async function getData(req, res, next) {
    try {
      const username = req.params.username;
      const userRegistrationModel =
        await userRegistrationService.findRegistrationByUsername(username);

      const isPresent = userRegistrationModel?.isPresent?.();
      if (isPresent === true) {
        const value = userRegistrationModel.get
          ? userRegistrationModel.get()
          : userRegistrationModel.value;
        return res.status(200).json(value);
      }

      if (isPresent === false) {
        return res.sendStatus(500);
      }

      if (userRegistrationModel != null) {
        return res.status(200).json(userRegistrationModel);
      }

      return res.sendStatus(500);
    } catch (err) {
      return next(err);
    }
  }

  async function updateRegistration(req, res, next) {
    try {
      const userRegistrationModel = req.body;
      const userRegistrationModel1 =
        await userRegistrationService.updateRegistration(userRegistrationModel);

      if (userRegistrationModel1 != null) {
        return res.sendStatus(200);
      }

      return res.status(500).send('Could not update user try again later');
    } catch (err) {
      return next(err);
    }
  }

  async function verifyRegistration(req, res, next) {
    try {
      const userRegistrationModel = req.body;
      const email =
        userRegistrationModel?.email ?? userRegistrationModel?.getEmail?.();

      const userRegistrationModel1 =
        await userRegistrationService.verifyFacilityProvider(email);

      if (userRegistrationModel1 != null) {
        return res.sendStatus(200);
      }

      return res.status(500).send('Could not verify user try again later');
    } catch (err) {
      return next(err);
    }
  }

  async function getAllUsers(req, res, next) {
    try {
      return res.status(200).json(await userRegistrationService.getAllRegistrations());
    } catch (err) {
      return next(err);
    }
  }

  async function banUser(req, res, next) {
    try {
      const username = req.query.username;
      return res.status(200).json(await userRegistrationService.banUser(username));
    } catch (err) {
      return next(err);
    }
  }

  async function getName(req, res, next) {
    try {
      const username = req.query.username;
      return res.status(200).json(await userRegistrationService.getName(username));
    } catch (err) {
      return next(err);
    }
  }

  // Mirrors the Spring annotations exactly
  router.post('/register', register);
  router.get('/login', login);
  router.get('/data/:username', getData);
  router.put('/updateRegistration', updateRegistration);
  router.put('/verify', verifyRegistration);
  router.get('/getAllUsers', getAllUsers);
  router.post('/ban', banUser);
  router.get('/getName', getName);

  return router;
}

module.exports = UserRegistrationController;
