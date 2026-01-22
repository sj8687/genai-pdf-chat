import { Worker } from "bullmq";
import fs from "fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";




const worker = new Worker(
    "file-upload-queue",
    async (job) => {
        const data = typeof job.data === "string"
            ? JSON.parse(job.data)
            : job.data;

        const filePath = data.path;

        const pdfData = new Uint8Array(fs.readFileSync(filePath));

        const pdf = await pdfjs.getDocument({ data: pdfData }).promise;

        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item) => item.str).join(" ") + "\n";
        }

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 800,
            chunkOverlap: 200,
        });

        const chunks = await splitter.splitText(text);


        console.log("chunk-------", chunks[0]);

        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: '',
            model: "text-embedding-004",
        });

        const vectorStore = await QdrantVectorStore.fromExistingCollection(
            embeddings,
            {
                url: 'http://localhost:6333',
                collectionName: 'pdf-docx'
            }
        );

        const docs = chunks.map((chunk, i) =>
            new Document({
                pageContent: chunk,
                metadata: { source: filePath, chunk: i }
            })
        );

        await vectorStore.addDocuments(docs);

        console.log("all set");
    },
    {
        concurrency: 5,
        connection: {
            host: "localhost",
            port: 6379,
        },
    }
);










// import { Worker } from "bullmq";
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { QdrantVectorStore } from "@langchain/qdrant";
// import { Document } from "@langchain/core/documents";
// import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

// const worker = new Worker(
//     'file-upload-queue',
//     async (job) => {
//         const data = JSON.parse(job.data)

//         const loader = new PDFLoader(data.path)
//         const docs = await loader.load();

//         // const splitter = new RecursiveCharacterTextSplitter({
//         //     chunkSize: 800,
//         //     chunkOverlap: 200,
//         // });

//         // const chunks = await splitter.splitText(docs);
//         console.log(docs);



// const embeddings = new GoogleGenerativeAIEmbeddings({
//     apiKey: AIzaSyBpc9sn7T1a-ZHljfM6Fd13WeoABnoweYc,
//     model: "text-embedding-004",
// });

// const vectorStore = await QdrantVectorStore.fromExistingCollection(
//     embeddings,
//     {
//         url: 'http://localhost:6333',
//         collectionName: 'pdf-docx'
//     }
// );

//         // await vectorStore.addDocument(docs);

//         console.log("all set");


//     },
//     {
//         concurrency: 100,
//         connection: {
//             host: 'localhost',
//             port: '6379',
//         },

//     }
// );










