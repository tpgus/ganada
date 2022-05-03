const jwt = require("jsonwebtoken");
const axios = require("axios");
const bcrypt = require("bcrypt");
const { Users } = require("../models");
const dotenv = require("dotenv");
dotenv.config();
const random = require("./mailVerification");
const {
  generateAccessToken,
  sendAccessToken,
  removeAccessToken,
  isAuthorized,
} = require("../controllers/tokenFunctions");

module.exports = {
  signUp: async (req, res) => {
    const { email, emailValidate, password, rePassword, phoneNumber, name } =
      req.body;

    if (
      !email ||
      !emailValidate ||
      !password ||
      !rePassword ||
      !phoneNumber ||
      !name
    ) {
      return res.json({ message: "필수 항목을 입력하세요." });
    }
    try {
      const userEmail = await Users.findOne({ where: { email } });
      const userNickname = await Users.findOne({ where: { name } });
      const hashed = await bcrypt.hash(password, 10);

      if (Number(emailValidate) !== random.number) {
        return res.json({ message: "잘못된 정보입니다." });
      }

      if (userEmail) {
        return res.json({ message: "중복된 이메일입니다." });
      } else if (userNickname) {
        return res.json({ message: "중복된 닉네임입니다." });
      } else {
        await Users.create({
          email,
          name,
          phoneNumber,
          password: hashed,
        });
        return res.status(201).json({ message: "회원가입 성공" });
      }
    } catch (err) {
      return res.status(500).json({ message: "서버 에러" });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await Users.findOne({ where: { email } });
      if (!user || !bcrypt.compareSync(password, user.dataValues.password)) {
        return res.json({ message: "잘못된 정보를 입력" });
      } else {
        delete user.dataValues.password;
        const accessToken = generateAccessToken(user.dataValues);
        sendAccessToken(res, accessToken);
      }
    } catch (err) {
      return res.status(500).json({ message: "서버 에러" });
    }
  },

  logout: async (req, res) => {
    const userInfo = isAuthorized(req);

    try {
      if (userInfo) {
        removeAccessToken(res);
      } else {
        return res.json({ message: "이미 로그아웃 된 상태입니다." });
      }
    } catch (err) {
      return res.status(500).json({ message: "서버 에러" });
    }
  },

  google: async (req, res) => {
    return res.status(200).json({ message: "ok" });
  },

  kakao: async (req, res) => {
    return res.status(200).json({ message: "ok" });
  },

  naver: async (req, res) => {
    const { code, state } = req.body;
    if (code && state) {
      const response = await fetch(
        `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${process.env.NAVER_CLIENT_ID}&client_secret=${process.env.NAVER_CLIENT_SECRET}&code=${code}&state=${state}`
      ).then((res) => res.json());
      const naverAccessToken = response.access_token;
      const naverUserInfo = await fetch(`https://openapi.naver.com/v1/nid/me`, {
        headers: {
          Authorization: `Bearer ${naverAccessToken}`,
        },
      }).then((res) => res.json());

      // Save DATABASE
      const email = naverUserInfo.response.email + "-Naver";
      const name =
        naverUserInfo.response.nickname + String(Math.random()).slice(2, 8);
      // const password = process.env.SOCIAL_LOGIN_PASSWORD;
      const image = naverUserInfo.response.profile_image;

      let userInfo = await Users.findOne({ email });
      if (!userInfo) {
        userInfo = await Users.create({ email, name, password, image });
      }
      const accessToken = generateToken(userInfo, "accessToken"); //도형님이 만든 토큰명으로 변경하기
      const refreshToken = generateToken(userInfo, "refreshToken");
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        path: "/api/users/auth/token",
        maxAge: 60 * 60 * 24 * 7,
      });
      res.json({
        _id: userInfo._id,
        accessToken,
        message: "네이버 로그인",
      });
    } else {
      res.status(500).json({ message: "서버 에러" });
    }
  },

  // 코드가 너무 길어질 경우, OAuth2.0
  // 또는 mailVerification에 대한 분리가 필요하다고 생각합니다.
  // -----------------------------------------------
  // mailVerification 파일 하나 만들어서 올리겠습니다.
};
