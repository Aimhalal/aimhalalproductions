// this helper is responsible for response in every Api Request

const response = async (status, message, data) => {
  return {
    status,
    message,
    data,
  };
};

export default {
  response,
};
