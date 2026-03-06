import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
// imports the mongoose library for interacting with MongoDB and bcryptjs for hashing passwords

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,// must be provided when creating a user
    },
    email: {
      type: String,
      required: true,
      unique: true, //make sure no two users can have the same email address
    },
    password: {
      type: String,
      required: function() { return !this.googleId; } // password is required if googleId is not provided
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true // allows multiple documents to have a null value for googleId

    },
    avatar: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['student', 'tutor', 'admin'], // restricts role to these three values
      default: 'student'
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt fields to the schema
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);//
};// compares the entered password with the hashed password stored in the database and returns true if they match, false otherwise

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {//
    return;// If the password field has not been modified, skip hashing and save the user document as is
  }
  const salt = await bcrypt.genSalt(10); // generates a salt with 10 rounds, which is used to enhance the security of the hashed password
  this.password = await bcrypt.hash(this.password, salt); 
}); // hashes the password before saving the user document to the database. It generates a salt and then hashes the password using that salt

const User = mongoose.model('User', userSchema);
//
export default User;//exports user model