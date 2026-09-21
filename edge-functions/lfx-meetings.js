import { handleLfxMeetingsRequest } from '../shared/lfx-meetings.js';

export default async (request) => handleLfxMeetingsRequest(request.url);
