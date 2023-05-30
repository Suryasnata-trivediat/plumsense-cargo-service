const db = require('../core/db');
var response, headers = {
  "Access-Control-Allow-Origin" : "*",
  "Access-Control-Allow-Headers" : "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Credentials" : true,
};

exports.handler =  async (event, context, callback) => {
  try {
    console.log(event);    
    return [];
  } catch(error) {
    console.log(error);
  	response = {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({
        error,
        message: "Something went wrong!!! " + error,
      })
    };
  }
  
  return response;
};