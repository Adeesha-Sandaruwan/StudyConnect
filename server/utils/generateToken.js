import jwt from 'jsonwebtoken';// Importing the jsonwebtoken library


const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {//Create the JWT with the user ID as the Payload
    expiresIn: '30d',// Setting the token to expire in 30 days
  });

  res.cookie('jwt', token, {//Store token in an HTTP-only cookie
    httpOnly: true,//only accessible via HTTP requests
    secure: process.env.NODE_ENV !== 'development',//only sent over HTTPS in production
    sameSite: 'strict',//
    maxAge: 30 * 24 * 60 * 60 * 1000,// Set cookie to expire in 30 days
  });
};

export default generateToken;