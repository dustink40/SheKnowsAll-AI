import { Configuration, OpenAIApi } from 'openai';
import NodeCache from 'node-cache';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const cache = new NodeCache({ stdTTL: 86400 });
const MAX_GENERATIONS_PER_IP = 100;  //<--this function reads a users IP address and logs how many times each IP has made an API call. It is currently set to 100, allowing others to use your API WILL drain your API credits, if you want to make your app public I'd recommend changing this number to something you are comfortable with.

const openai = new OpenAIApi(configuration);
const basePrompt =
// This is where you enter your version of a base prompt. If you want a friend tell it you are my best friend..... If you want a bot that replies to you with a rap in the style of kendrick lamar based on a topic you provide, this is where you do that. Make sure the base prompt stays within the backticks.
/*keep-->*/ ` You are a leading expert in women studies and psycology, You have a masters degree in women psychology and have done countless womens studies. You have also done dozens of experiments to find out how a woman thinks and behaves in a variety of different situations. You have learned how they think and act during a breakup as well as how they act when things are great. you have read countless books like the female brain as well as other literature that made you the expert that you are. Your main objective is to help men understand women. When asked a question from a user you use your extensive knowledge base to give them an accurate answer and a better understanding of women. You only respond with the answer to the question. Also You are a friendly and helpful bot named ChatBot. You love chatting with people and providing useful information. You have a vast knowledge base and can answer questions on various topics. Your main objective is to assist users and make their experience enjoyable. When asked a question, you use your knowledge and expertise to provide accurate and helpful responses. Let's have a great conversation!

Opponents verse:

`//<-- keep them

const generateAction = async (req, res) => {

  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const cacheKey = `ip_${ipAddress}`;

  const cacheValue = cache.get(cacheKey);
  if (cacheValue && cacheValue.count >= MAX_GENERATIONS_PER_IP) {
    res.status(429).send('Too many requests');
    return;
  }

  console.log(`API: ${basePrompt}${req.body.userInput}`);

  // If the input does not end with a period, add one
  req.body.userInput.endsWith('.' || '!' || '?') || (req.body.userInput += '.');

  try {
    const baseCompletion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `${basePrompt}${req.body.userInput}`,
      temperature: 0.3,  //this is where you allow creative freedom up to chatgpt, the lower the number the more strict the bot will stay to your base prompt, although it gets repetitive and robotic, the higher the number the wilder the responses will be
      max_tokens: 250,   //this is the maximum amount of tokens that can be used per each API call. Adding more does not neccessarily mean it will get a longer promp
    });

    const basePromptOutput = baseCompletion.data.choices.pop();

    if (!cacheValue) {
      cache.set(cacheKey, { count: 1 });
    } else {
      cache.set(cacheKey, { count: cacheValue.count + 1 });
    }
    res.status(200).json({ output: basePromptOutput });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating lyrics');
  }
};


export default generateAction;
