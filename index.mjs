import { WorkMailClient, CreateUserCommand ,RegisterToWorkMailCommand } from "@aws-sdk/client-workmail";
import { fromIni } from "@aws-sdk/credential-providers";
import imaps from "imap-simple";
import { simpleParser } from "mailparser";
// const { WorkMailClient, CreateUserCommand, RegisterToWorkMailCommand } = require("@aws-sdk/client-workmail");
// const { fromIni } = require("@aws-sdk/credential-providers");
// const imaps = require("imap-simple");
// const { simpleParser } = require("mailparser");

const workMailClient = new WorkMailClient({
  region: "us-east-1",
  credentials: fromIni(),
});

export const handler = async (event, context) => {
  const config = {
    imap: {
      user: 'test@businessonbot.awsapps.com', // Replace with the user's email
      password: 'testpassword123+',            // Replace with the user's password
      host: 'imap.mail.us-east-1.awsapps.com', // Replace with the IMAP endpoint for your region
      port: 993,
      tls: true,
      authTimeout: 3000
    }
  };
  console.log(config);

  try {
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      struct: true,
      markSeen: false
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    const parsedEmails = await Promise.all(messages.map(async (message) => {
      const parts = imaps.getParts(message.attributes.struct);
      const textPart = parts.find(part => part.type === 'text' && part.subtype === 'plain');
      const htmlPart = parts.find(part => part.type === 'text' && part.subtype === 'html');

      const fetchTextPart = textPart ? connection.getPartData(message, textPart) : Promise.resolve('');
      const fetchHtmlPart = htmlPart ? connection.getPartData(message, htmlPart) : Promise.resolve('');

      const [text, html] = await Promise.all([fetchTextPart, fetchHtmlPart]);
      // console.log(message.parts);

      return {
        uid: message.attributes.uid,
        subject: message.parts.find(part => part.which === 'HEADER').body.subject[0],
        from: message.parts.find(part => part.which === 'HEADER').body.from[0],
        to: message.parts.find(part => part.which === 'HEADER').body.to[0],
        replyTo : message.parts.find(part => part.which === 'HEADER').body['reply-to'],
        date: message.parts.find(part => part.which === 'HEADER').body.date[0],
        text,
        // html
      };
    }));

    parsedEmails.forEach(email => {
      console.log('UID:', email.uid);
      console.log('Subject:', email.subject);
      console.log('From:', email.from);
      console.log('To:', email.to);
      if(email.replyTo){
        console.log('Reply To:', email.replyTo);
      }
      console.log('Date:', email.date);
      console.log('Text:', email.text);
      // if (email.html) {
      //   console.log('HTML:', email.html);
      // }
      console.log('-------------------------------');
    });

    connection.end();
    return parsedEmails;
  } catch (err) {
    console.error('Error connecting to IMAP:', err);
    throw new Error('Failed to fetch emails');
  }
};

handler();






// const client = new WorkMailClient({
//   region: "us-east-1",
//   credentials: fromIni(),
// });

// const config = {
//   imap: {
//     user: 'test@businessonbot.awsapps.com', // Replace with the user's email
//     password: 'testpassword123+',    // Replace with the user's password
//     host: 'imap.mail.us-east-1.awsapps.com', // Replace with the IMAP endpoint for your region
//     port: 993,
//     tls: true,
//     authTimeout: 3000
//   }
// };
// imaps.connect(config).then(connection => {
//   return connection.openBox('INBOX').then(() => {
//     const searchCriteria = ['ALL'];
//     const fetchOptions = {
//       bodies: ['HEADER', 'TEXT', ''],
//       struct: true,
//       markSeen: false
//     };

//     return connection.search(searchCriteria, fetchOptions).then(messages => {
//       const parsedMessages = messages.map(message => {
//         const parts = imaps.getParts(message.attributes.struct);
//         const textPart = parts.find(part => part.type === 'text' && part.subtype === 'plain');
//         const htmlPart = parts.find(part => part.type === 'text' && part.subtype === 'html');

//         const fetchTextPart = textPart ? connection.getPartData(message, textPart) : Promise.resolve('');
//         const fetchHtmlPart = htmlPart ? connection.getPartData(message, htmlPart) : Promise.resolve('');

//         return Promise.all([fetchTextPart, fetchHtmlPart]).then(([text, html]) => {
//           return {
//             uid: message.attributes.uid,
//             subject: message.parts.find(part => part.which === 'HEADER').body.subject[0],
//             from: message.parts.find(part => part.which === 'HEADER').body.from[0],
//             to: message.parts.find(part => part.which === 'HEADER').body.to[0],
//             date: message.parts.find(part => part.which === 'HEADER').body.date[0],
//             text,
//             html
//           };
//         });
//       });

//       return Promise.all(parsedMessages);
//     });
//   });
// }).then(emails => {
//   emails.forEach(email => {
//     console.log('UID:', email.uid);
//     console.log('Subject:', email.subject);
//     console.log('From:', email.from);
//     console.log('To:', email.to);
//     console.log('Date:', email.date);
//     console.log('Text:', email.text);
//     if (email.html) {
//       console.log('HTML:', email.html);
//     }
//     console.log('-------------------------------');
//   });
// }).catch(err => {
//   console.error('Error connecting to IMAP:', err);
// });

// imaps.connect(config).then(connection => {
//   return connection.openBox('INBOX').then(() => {
//     const searchCriteria = ['ALL'];
//     const fetchOptions = {
//       bodies: ['HEADER', 'TEXT'],
//       markSeen: false
//     };

//     return connection.search(searchCriteria, fetchOptions).then(messages => {
//       messages.forEach(item => {
//         const all = item.parts.find(part => part.which === 'TEXT');
//         const id = item.attributes.uid;
//         const idHeader = 'Imap-Id: ' + id + '\r\n';

//         simpleParser(idHeader + all.body, (err, mail) => {
//           console.log(typeof mail);
//           console.log( mail);
//           // if (err) {
//           //   console.error('Error parsing email:', err);
//           // } else {
//           //   console.log('Subject:', mail.subject);
//           //   console.log('From:', mail.from.value[0].address);
//           //   console.log('To:', mail.to.value[0].address);
//           //   console.log('Date:', mail.date);
//           //   console.log('Text:', mail.text);
//           //   console.log('-------------------------------');
//           // }
//         });
//       });
//     });
//   });
// }).catch(err => {
//   console.error('Error connecting to IMAP:', err);
// });


// const user = {
//   Name: "Testuser",
//   DisplayName: "test",
//   Password: "testpassword123+",
//   OrganizationId: "m-f85496526f224719a458ec8f910dd6e4",
// };
// const cmd = new CreateUserCommand(user);
// const resp = await client.send(cmd);

// console.log(resp);

// const input = {
//   OrganizationId : "m-f85496526f224719a458ec8f910dd6e4",
//   EntityId : '52ef4c1d-1504-4b2d-b049-5510d5935009',
//   Email : "test@businessonbot.awsapps.com"
// }
// const command = new RegisterToWorkMailCommand(input);
// const response = await client.send(command);


// console.log(response);
