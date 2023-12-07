const Joi = require('joi');

const userValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string().required().min(3).max(256),
    email: Joi.string().required().min(6).max(256).email(),
    password: Joi.string().required().min(6).max(1024),
  });

  return schema.validate(data);
};

module.exports = userValidation;
