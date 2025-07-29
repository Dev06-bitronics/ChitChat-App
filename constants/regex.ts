// Regex patterns for app-wide usage

export const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; // Minimum 8 chars, at least one letter and one number
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/; // 3-16 chars, letters, numbers, underscores
export const PHONE_REGEX = /^[0-9]{10}$/; // 10 digit phone number

// Chat/media related regex patterns
export const YOUTUBE_ID_REGEX = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})/;
export const SPOTIFY_REGEX = /open\.spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+/;
export const VIMEO_REGEX = /vimeo\.com\/\d+/;
export const SOUNDCLOUD_REGEX = /soundcloud\.com\//;
export const TWITTER_REGEX = /twitter\.com\//;
export const URL_REGEX = /(https?:\/\/[^\s]+)/g;
export const YOUTUBE_LINKIFY_REGEX = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/[\w-]{11}))/g;
export const MEDIA_LINK_REGEX = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/[\w-]{11})|https?:\/\/open\.spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+|https?:\/\/vimeo\.com\/\d+|https?:\/\/soundcloud\.com\/\S+|https?:\/\/twitter\.com\/\S+)/;

