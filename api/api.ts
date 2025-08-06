import apiClient from '@/api/apiConst';

export const USER_LOGIN = async (data: any) => {
    return await apiClient.post('api/v1/auth/login', data);
};

export const USER_REGISTER = async (data: any) => {
    return await apiClient.post('api/v1/auth/register', data);
};

export const ALL_USERS = async () => {
    return await apiClient.get('api/v1/users')
};

export const GOOGLE_AUTH = async () => {
    return await apiClient.get('api/v1/auth/google');
};

export const CHAT_CONVERSATION = async (userId: any) => {
    return await apiClient.get(`api/v1/chats/users/${userId}/messages`);
};

export const GET_PROFILE_DETAILS = async () => {
    return await apiClient.get(`api/v1/users/me`);
};

export const GROUP_ALL_USERS = async () => {
    return await apiClient.get(`api/v1/group/users`);
};

export const ADD_USERS_TO_GROUP = async (conversationId: any) => {
    return await apiClient.get(`api/v1/group/${conversationId}/available-users`);
};

// export const getChatConversation = async (userId: string) => {
//   return await apiClient.post('chat/conversation', { userId });
// };

export const USER_LOGOUT = async () => {
    return await apiClient.post('api/v1/auth/logout');
};

