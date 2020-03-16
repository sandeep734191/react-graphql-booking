var express = require('express');
var bodyParser = require('body-parser');
var graphqlHttp = require('express-graphql');
var { buildSchema } = require('graphql');
var mongoose = require('mongoose');
const Event = require('./models/event');
const User = require('./models/user');

var app = express();
app.use(bodyParser.json());
mongoose.connect('mongodb+srv://sandeep:Ssandy@499@cluster1-4qsd3.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true }).then(() => {
    app.listen(3030, () => {
        console.log('successfully connected to mongodb clooud')
    });
}).catch((err) => {
    console.log(err);
});

const user=userId=>{
    return User.findById(userId)
    .then(user=>{
        return {...user._doc,_id:user._id}
    })
    .catch(err=>{
        throw err;
    })
}


app.use('/graphql', graphqlHttp({
    schema: buildSchema(
        `
        type User {
            _id: ID,
            email: String!,
            password: String
            createdEvents: [Event!]
        }
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
            creator: User!

        }
        
        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }
        input UserInput {
            email: String!,
            password: String!
        }

        type RootQuery {
            events: [Event!]!
        }
        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        schema {
            query: RootQuery,
            mutation: RootMutation
        }
        `
    ),
    rootValue: {
        events: () => {
            return Event.find().then((events) => {
                return events.map((event) => {
                    return { 
                        ...event._doc, 
                        _id: event._doc._id.toString(),
                        creator: user.binf(this,event._doc.creator)
                    }
                })
            }).catch((err) => {
                throw err;
            });
        },

        createEvent: (args) => {

            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: args.eventInput.price,
                date: new Date(args.eventInput.date),
                creator: '5d6b9281530d4644cb6659d9'
            });
            let createdEvent;
            return event.save().then((result) => {
                console.log(result);
                createdEvent = { ...result._doc, _id: result._doc._id.toString() }
                return User.findById('5d6b9281530d4644cb6659d9')
            })
                .then((user) => {
                    if (!user) {
                        throw new Error('user not found');
                    }
                    user.createdEvents.push(event);
                    return user.save();
                }).
                then((result) => {
                    return createdEvent;
                }).
                catch((err) => {
                    throw err;
                });
        },

        createUser: (args) => {
            //return bcrypt.hash(args.userInput.password,12).
            //  then((hashedPassword) => {
            return User.findOne({ email: args.userInput.email }).then((user) => {
                if (user) {
                    throw new Error('user already exists');
                }
                return args.userInput.password;//shoud be hashed
            }).then((hashedPassword) => {
                const user = new User({
                    email: args.userInput.email,
                    password: hashedPassword
                });
                return user.save();
            }).then(result => {
                return { ...result._doc }
            }).catch(err => {
                throw err;
            })
            /*}).then(result=>{
                return {...result._doc,_id:result.id};
            }).catch((err)=>{
                throw err;
            })*/

        },
    },

    graphiql: true
}));

