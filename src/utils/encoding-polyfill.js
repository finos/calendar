import { TextEncoder, TextDecoder } from 'fastestsmallesttextencoderdecoder';

if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = TextDecoder;
}