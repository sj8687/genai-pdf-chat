import express from "express";
import cors from "cors";
import multer from "multer";
import { Queue } from "bullmq";
import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";


const ai = new GoogleGenAI({
    apiKey:''
});


const queue = new Queue('file-upload-queue', {
    connection: {
        host: 'localhost',
        port: '6379',
    },
})

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniquefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniquefix} - ${file.originalname}`);
    }
})

const upload = multer({ storage: storage })

const app = express();
app.use(cors());



app.get('/', (req, res) => {
    return res.json({ status: "all good" })
})


app.post('/upload/pdf', upload.single('pdf'), async (req, res) => {
    await queue.add('file-ready',
        JSON.stringify({
            filename: req.file.originalname,
            destination: req.file.destination,
            path: req.file.path,
        })
    )
    res.json({ message: "uploaded" })
})



app.get('/chat', async (req, res) => {
    try {
        const userQuery = req.query.message;

        console.log("query--------------", userQuery);

        if (!userQuery) return res.status(400).json({ error: "Message is required" });

        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: '',
            model: "text-embedding-004",
        });

        const vectorStore = await QdrantVectorStore.fromExistingCollection(
            embeddings,
            {
                url: 'http://localhost:6333',
                collectionName: 'pdf-docx',
            }
        );

        const ret = vectorStore.asRetriever({ k: 2 });
        const docs = await ret.invoke(userQuery);

        const contextText = docs.map(doc => doc.pageContent).join("\n\n");

        console.log("context-----------", contextText);



        const SYSTEM_PROMPT = `
        You are a helpful AI Assistant who answers user queries based on the available context.
        Context:
        ${contextText}
        `;

        const chatResult = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            systemInstruction: SYSTEM_PROMPT,
            contents: [
                { role: 'user', parts: [{ text: userQuery }] },
            ],
        });


        console.log(chatResult);


        const aiResponse = chatResult.response ? chatResult.response.text() : chatResult.text;

        return res.json({
            message: aiResponse,
            docs: docs,
        });

    } catch (error) {
        console.error("Workflow Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});







app.listen(8000, () => { console.log(`port ${8000}`) })