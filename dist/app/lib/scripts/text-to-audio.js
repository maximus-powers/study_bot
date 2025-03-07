import OpenAI from 'openai';
import { updateAudioUrlInDatabase, getAudioUrlsFromDatabase, updateLastIncludedDate, } from '../queries';
import AWS from 'aws-sdk';
const s3 = new AWS.S3({
    endpoint: `https://s3.us-west-004.backblazeb2.com`,
    accessKeyId: process.env.KEY_ID,
    secretAccessKey: process.env.ACCOUNT_ID,
    signatureVersion: 'v4',
});
async function uploadToBackblaze(fileBuffer, fileName) {
    try {
        const params = {
            Bucket: 'study-bot',
            Key: fileName,
            Body: fileBuffer,
            ContentType: 'audio/mpeg',
        };
        const response = await s3.upload(params).promise();
        return `https://s3.us-west-004.backblazeb2.com/study-bot/${response.Key}`;
    }
    catch (error) {
        console.error(`Error uploading ${fileName} to Backblaze:`, error);
        throw error;
    }
}
export async function sectionToSpeech(section, sectionKey, rowId) {
    const openai = new OpenAI();
    try {
        const fullSectionText = section.tab_name +
            '\n' +
            section.snippets.map((snippet) => snippet.text).join('\n');
        const mp3 = await openai.audio.speech.create({
            model: 'tts-1-hd',
            voice: 'alloy',
            input: fullSectionText,
        });
        const sectionBuffer = Buffer.from(await mp3.arrayBuffer());
        const fileUrl = await uploadToBackblaze(sectionBuffer, `${sectionKey}.mp3`);
        await updateAudioUrlInDatabase(rowId, sectionKey, fileUrl);
        // update the last_included date in the cards table
        for (const snippet of section.snippets) {
            await updateLastIncludedDate(snippet.card_id);
        }
    }
    catch (error) {
        console.error(`Error processing section ${sectionKey}:`, error);
        throw error;
    }
}
export async function getSignedUrls(userEmail) {
    try {
        const audioUrls = await getAudioUrlsFromDatabase(userEmail);
        const signedUrls = {};
        for (const key in audioUrls) {
            if (audioUrls[key]) {
                const params = {
                    Bucket: 'study-bot',
                    Key: `${key}.mp3`,
                    Expires: 60 * 60, // 1 hour
                };
                signedUrls[key] = s3.getSignedUrl('getObject', params);
                console.log(`Signed URL for ${key}: ${signedUrls[key]}`);
            }
        }
        return signedUrls;
    }
    catch (error) {
        console.error('Error generating signed URLs:', error);
        throw error;
    }
}
