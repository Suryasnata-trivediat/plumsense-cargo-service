// ********* Invite user ********* //
const inviteMasterUser = async (userToInvite, db, dbconnection, eventBridge, cognito)  => {
    try {
        // ******* Adding customer ******* // 
        let customeradded = await addCustomer(userToInvite.customerdata, db, dbconnection);
        
        if(customeradded && customeradded.insertId) {
            userToInvite.userdata.customerid = customeradded.insertId;
            userToInvite.userdata.role = userToInvite.userdata.role ? userToInvite.userdata.role : "admin";
            
            // ******* Adding Corporate location for customer ******* // 
            await eventBridge.send({
                EventBusName: process.env.EVENTBUS,
                Source: "CMD_ADD_LOCATION",
                DetailType: 'Publish the command and perform the operation',
                Detail: {
                    locations: [{
                        name: "Corporate",
                        isgeneric: 1,
                        customerid: userToInvite.userdata.customerid
                    }],
                }
            });
            
            // ******* Inviting user ******* //
            await cognito.adminCreateUser({
                UserPoolId: process.env.USERPOOL_ID,
                Username: userToInvite.userdata.name,
                DesiredDeliveryMediums: [ "EMAIL" ],
                ForceAliasCreation: true,
                UserAttributes: [
                  {
                    Name: 'email',
                    Value: userToInvite.userdata.name
                  },
                  {
                    Name: 'custom:customerid',
                    Value: JSON.stringify(userToInvite.userdata.customerid)
                  },
                  {
                    Name: 'custom:role',
                    Value: userToInvite.userdata.role
                  },
                  {
                    Name: 'custom:customergroupid',
                    Value: JSON.stringify(userToInvite.customerdata.customergroupid)
                  },
                ],
                ValidationData: [
                  {
                    Name: 'isInvited',
                    Value: "1"
                  }
                ]
            });
            
            // ******* Adding user to account table ******* //
            userToInvite.userdata.isactive = 0;
            userToInvite.userdata.addLocation = false; 
            
            await eventBridge.send({
                EventBusName: process.env.EVENTBUS,
                Source: "CMD_ADD_ACCOUNT",
                DetailType: 'Publish the command and perform the operation',
                Detail: userToInvite.userdata
            });
        }
        return userToInvite;
    } catch(error) {
        console.log("### Error in inviteUser() ###");
        throw error;
    }
};

// ********* Add customer ********* //
const addCustomer = async (customer, db, dbconnection)  => {
    try {
        let customer_ = await getCustomerByName(customer.name, db, dbconnection);
        if(!customer_) {
            customer.createdon = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            let sql = `INSERT INTO ${db.dbname()}.customers (name, createdon, createdby, customergroupid) VALUES 
            ('${customer.name}', '${customer.createdon}', ${customer.createdby}, ${customer.customergroupid})`;
            return await db.queryDB(sql ,0 ,dbconnection);
        } else {
            console.log(`Customer ${customer.name} already exists!`);
            return null;
        }
    } catch(error) {
        console.log("### Error in addCustomer() ###");
        throw error;
    }
};

// ********* Get customer by customer name ********* //
const getCustomerByName = async (name, db, dbconnection)  => {
    try {
        const sql = `SELECT * FROM ${db.dbname()}.customers where name = '${name}'`;
        const customer = await db.queryDB(sql ,0 ,dbconnection);
        if(customer && customer.length > 0) {
            return customer[0];
        }
        return null;
    } catch(error) {
        console.log("### Error in getCustomerByName() ###");
        throw error;
    }
};

// ********* Get all users ********* //
const listUsers = async (db, dbconnection)  => {
    try {
        const sql = `SELECT account.*, customers.name as customername, roles.name as role FROM ${db.dbname()}.account
        LEFT JOIN ${db.dbname()}.roles ON account.roleid = roles.roleid
        LEFT JOIN ${db.dbname()}.customers ON account.customerid = customers.customerid`;
        return await db.queryDB(sql ,0 ,dbconnection);
    } catch(error) {
        console.log("### Error in listUsers() ###");
        throw error;
    }
};

module.exports = {
    invite: inviteMasterUser,
    list: listUsers
};