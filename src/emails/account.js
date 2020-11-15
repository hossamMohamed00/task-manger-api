const sgMail = require('@sendgrid/mail')

const sendgridApiKey = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(sendgridApiKey);

const sendWelcomeEmail = (email, name) => {
   sgMail.send({
      to: email,
      from: 'a01122882174@gmail.com',
      subject: 'Thanks for joining in!',
      text: `Welcome to our app, ${name}. let me know how you get along with the app.`
   }).then(() => {
      console.log('Welcome message sent to ' + email);
   })
}

const sendCancelationEmail = (email, name) => {
   sgMail.send({
      to: email,
      from: 'a01122882174@gmail.com',
      subject: 'Sorry to see you go!',
      text: `Goodbye, ${name}. I hope to see you back sometime soon.`
   })
}

module.exports = {
   sendWelcomeEmail,
   sendCancelationEmail
}

