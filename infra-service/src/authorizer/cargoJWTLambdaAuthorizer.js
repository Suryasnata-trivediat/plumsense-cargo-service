const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
var AWS = require('aws-sdk');
var http = require('https');

AWS.config.update({ region: process.env.REGION });

const verificationOptions = { "algorithms": "RS256" };

const keyClient = jwksClient({
    cache: true,
    cacheMaxAge: 86400000, //value in ms 
    rateLimit: true,
    jwksRequestsPerMinute: 10,
    strictSsl: true,
    jwksUri: `https://cognito-idp.${process.env.REGION}.amazonaws.com/${process.env.USERPOOL_ID}/.well-known/jwks.json`
});

var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

function preparePolicyObject(principalId, context, resource, permission = "Allow") {
    var policy = {
        "principalId": principalId,
        "context": context,
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": permission,
                    "Resource": resource
                }
            ]
        }
    };
    return policy;
}

function getSigningKey(header = decoded.header, callback) {
    keyClient.getSigningKey(header.kid, function (err, key) {
        if(err) {
            console.log("Error in getting Signing key ---", err);
        }
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

function extractTokenFromHeader(e) {
    if (e.authorizationToken && e.authorizationToken.split(' ')[0] === 'Bearer') {
        return e.authorizationToken.split(' ')[1];
    } else {
        return e.authorizationToken;
    }
}

exports.handler = async (event, context) => {
    var response;
    let token = extractTokenFromHeader(event) || '';   
    try {        
        var custAttr= await getCustomAttributeAsync(token);
        // var contextObj = {
        //     sub: custAttr.sub,
        //     // userid: custAttr.userid,
        //     accountid: custAttr.accountid,
        //     role: custAttr.role,
        //     userEmailId: custAttr.userEmailId
        //     // accountid: queryres.length > 0 ? queryres[0].accountid : ''
        // };      
        var contextObj = {
            sub: custAttr.sub,
            userid: custAttr.userid,
            accountid: custAttr.accountid,
            customerid: custAttr.customerid,
            customergroupid: custAttr.customergroupid,
            role: custAttr.role,
        };   
        var result = await validateTokenAsync(token, event, contextObj);        
        response = result;    
    } catch(error) {        
        console.log('Error: ' + JSON.stringify(error));                
        var permission = preparePolicyObject(null, null, event.methodArn, "Deny");        
        console.log('Hence returning unauthorized response');        
        response = permission;        
    }    
    return response;
};

const validateTokenAsync = async (token, event, contextObj) => {   
    return new Promise((resolve, reject) => {      
        jwt.verify(token, getSigningKey, verificationOptions, (error, result) => {
            if(error) {                
                console.log('Error in verifying JWT token:' + JSON.stringify(error));                
                var permission = preparePolicyObject(null, null, event.methodArn, "Deny");                
                console.log('Hence returning unauthorized response');                
                reject(permission);                
            } else {               
                var object = preparePolicyObject(contextObj.sub, contextObj, event.methodArn);                    
                console.log('Returning authorized response');                
                resolve(object);
            }
        });    
    });    
};

const getCustomAttributeAsync = async (token) => {
    return new Promise((resolve, reject) => {      
        cognitoidentityserviceprovider.getUser({ AccessToken: token }, (error, result) => {
            if(error) {                
                console.log('Error in getting user from cognito: ' + JSON.stringify(error));                
                reject(error);                
            } else {
                // var custAttrObj = {
                //     sub: user.UserAttributes.find(x => x.Name === "sub").Value,
                //     userEmailId: user.UserAttributes.find(x => x.Name === "email") ? user.UserAttributes.find(x => x.Name === "email").Value : "",
                //     role: user.UserAttributes.find(x => x.Name === "custom:role") ? user.UserAttributes.find(x => x.Name === "custom:role").Value : "",
                //     accountid: user.UserAttributes.find(x => x.Name === "custom:accountid") ? user.UserAttributes.find(x => x.Name === "custom:accountid").Value : "",
                // };    
                var user = result.UserAttributes.find(x => x.Name === "email");   
                var custAttrObj = {
                    sub: result.UserAttributes.find(x => x.Name === "sub").Value,
                    userEmailId: user ? user.Value : "",
                    customerid: result.UserAttributes.find(x => x.Name === "custom:customerid") ? result.UserAttributes.find(x => x.Name === "custom:customerid").Value : "",
                    customergroupid: result.UserAttributes.find(x => x.Name === "custom:customergroupid") ? result.UserAttributes.find(x => x.Name === "custom:customergroupid").Value : "",
                    accountid: result.UserAttributes.find(x => x.Name === "custom:accountid") ? result.UserAttributes.find(x => x.Name === "custom:accountid").Value : "",
                    role: result.UserAttributes.find(x => x.Name === "custom:role") ? result.UserAttributes.find(x => x.Name === "custom:role").Value : "",
                };            
                resolve(custAttrObj);
            }
        });    
    });    
};