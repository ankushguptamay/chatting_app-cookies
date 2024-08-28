import joi from "joi";

export const validateUser = (data) => {
  const schema = joi.object().keys({
    fullName: joi.string().min(3).max(50).required(),
    email: joi.string().email().required().label("Email"),
    mobileNumber: joi
      .string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
    password: joi
      .string()
      // .regex(RegExp(pattern))
      .required()
      .min(8),
  });
  return schema.validate(data);
};

export const userLogin = (data) => {
  const schema = joi.object().keys({
    email: joi.string().email().required().label("Email"),
    password: joi
      .string()
      // .regex(RegExp(pattern))
      .required()
      .min(8),
  }); //.options({ allowUnknown: true });
  return schema.validate(data);
};

export const createPrivateChat = (data) => {
  const schema = joi.object().keys({
    secondId: joi.string().required(),
  });
  return schema.validate(data);
};

export const createGroupChatValidation = (data) => {
  const schema = joi.object().keys({
    members: joi.array().required(),
    chatName: joi.string().required(),
  });
  return schema.validate(data);
};

export const createMessageValidation = (data) => {
  const schema = joi.object().keys({
    chatId: joi.string().required(),
    message: joi.string().optional(),
  });
  return schema.validate(data);
};

export const addMembersValidation = (data) => {
  const schema = joi.object().keys({
    members: joi.array().required(),
    chatId: joi.string().required(),
  });
  return schema.validate(data);
};

export const sendFriendRequestValidation = (data) => {
  const schema = joi.object().keys({
    receiverId: joi.string().required(),
  });
  return schema.validate(data);
};

export const acceptFriendRequestValidation = (data) => {
  const schema = joi.object().keys({
    accept: joi.boolean().required(),
  });
  return schema.validate(data);
};

export const adminRegistration = (data) => {
  const schema = joi.object().keys({
    name: joi.string().required(),
    email: joi.string().email().required().label("Email"),
    password: joi
      .string()
      // .regex(RegExp(pattern))
      .required()
      .min(8),
  });
  return schema.validate(data);
};
