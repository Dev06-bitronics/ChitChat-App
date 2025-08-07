// Regex patterns for Login page
export const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; 
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/; 
export const PHONE_REGEX = /^[0-9]{10}$/; 

// Chat/media related regex patterns
export const YOUTUBE_ID_REGEX = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})/;
export const SPOTIFY_REGEX = /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)(?:\?|$)/;
export const VIMEO_REGEX = /vimeo\.com\/(\d+)/;
export const SOUNDCLOUD_REGEX = /soundcloud\.com\//;
export const TWITTER_REGEX = /twitter\.com\//;
export const URL_REGEX = /(https?:\/\/[^\s]+)/g;
export const YOUTUBE_LINKIFY_REGEX = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11})/g;
export const MEDIA_LINK_REGEX = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/[\w-]{11})|https?:\/\/open\.spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+|https?:\/\/vimeo\.com\/\d+|https?:\/\/soundcloud\.com\/\S+|https?:\/\/twitter\.com\/\S+)/;
export const SPOTIFY_LINKIFY_REGEX = /https?:\/\/open\.spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+/g;
export const VIMEO_LINKIFY_REGEX = /https?:\/\/vimeo\.com\/\d+/g;
