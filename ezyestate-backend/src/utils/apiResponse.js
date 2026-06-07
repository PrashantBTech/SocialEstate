const sendResponse = (res, statusCode, success, message, data = {}, meta = {}) => {
  const response = { success, message };
  if (Object.keys(data).length > 0 || Array.isArray(data)) response.data = data;
  if (Object.keys(meta).length > 0) response.meta = meta;
  return res.status(statusCode).json(response);
};

module.exports = {
  success: (res, message, data = {}, meta = {}, code = 200) =>
    sendResponse(res, code, true, message, data, meta),
  created: (res, message, data = {}) =>
    sendResponse(res, 201, true, message, data),
  error: (res, message, code = 400, errors = []) => {
    const response = { success: false, message };
    if (errors.length > 0) response.errors = errors;
    return res.status(code).json(response);
  },
};
