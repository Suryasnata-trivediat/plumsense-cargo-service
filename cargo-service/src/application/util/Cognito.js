const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.REGION});
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});

// ********* Admin Update User Attributes ********* //
const adminUpdateUserAttributes = async (username, attributesToUpdate)  => { 
    try {
        var params = {
            UserPoolId: process.env.USERPOOL_ID,
            Username: username,
            UserAttributes: attributesToUpdate
        };
        return new Promise((resolve, reject) => {      
            cognitoidentityserviceprovider.adminUpdateUserAttributes(params, (error, result) => {
                if(error) {
                    console.log("Error in adminUpdateUserAttributes()");
                    reject(error);                    
                } else {
                    resolve(result);
                }
            });        
        });
    } catch(error) {
        console.log("### Error in adminUpdateUserAttributes() ###");
        throw error;
    }
};

// ********* Admin Create User ********* //
const adminCreateUser = async (params)  => { 
    try {
        return new Promise((resolve, reject) => {      
            cognitoidentityserviceprovider.adminCreateUser(params, (error, result) => {
                if(error) {
                    console.log("### Error in adminCreateUser() ###");
                    reject(error);                    
                } else {
                    resolve(result);
                }
            });        
        });
    } catch(error) {
        console.log("### Error in adminCreateUser() ###");
        throw error;
    }
};

// ********* Admin delete user ********* //
const adminDeleteUser = async (username)  => { 
    try {
        var params = {
            UserPoolId: process.env.USERPOOL_ID,
            Username: username
        };
        return new Promise((resolve, reject) => {      
            cognitoidentityserviceprovider.adminDeleteUser(params, (error, result) => {
                if(error) {
                    console.log("### Error in adminDeleteUser() ###");
                    reject(error);                    
                } else {
                    resolve(result);
                }
            });        
        });
    } catch(error) {
        console.log("### Error in adminDeleteUser() ###");
        throw error;
    }
};

module.exports = {
    updateUserAttributes: adminUpdateUserAttributes,
    adminCreateUser: adminCreateUser,
    adminDeleteUser: adminDeleteUser
};