import { URL_REGEX } from "@/constants/regex";
import { format } from "date-fns";
import { jwtDecode } from 'jwt-decode';
import { Message } from "@/screens/ChatScreen/ChatScreen.types";
import { store } from "@/redux/store/store";
import { clearToken } from "@/redux/reducers/userReducer";

export const generateInitials = (name?: string | null): string => {
  if (!name) return 'U';

  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name[0]?.toUpperCase() || 'U';
};


export function getLastSeenStatus(user: any) {
  if (user?.isOnline) return 'Online';
  if (!user?.lastSeen) return 'Offline';
  const lastSeenDate = new Date(user.lastSeen);
  const now = new Date();
  const isToday = lastSeenDate.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = lastSeenDate.toDateString() === yesterday.toDateString();
  if (isToday) {
    return `Last seen ${format(lastSeenDate, 'h:mm a')}`;
  } else if (isYesterday) {
    return 'Yesterday';
  } else {
    return format(lastSeenDate, 'dd:MM:yy');
  }
}

export function formatTo12Hour(time?: string) {
  if (!time || typeof time !== 'string') return '';
  const date = new Date(time);
  if (!isNaN(date.getTime())) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  const match = time.match(/(\d{2}):(\d{2})/);
  if (!match) return time;
  let [_, hour, minute] = match;
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
}

export function formatChatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  if (diff < oneDay && now.getDate() === date.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } else if (diff < 2 * oneDay && now.getDate() - date.getDate() === 1) {
    return 'Yesterday';
  } else if (diff < 7 * oneDay) {
    return date.toLocaleDateString([], { weekday: 'long' });
  } else {
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
}

export function isSameMinute(a: Message, b: Message) {
  const aTime = new Date(a.timestamp || a.createdAt || a.updatedAt || 0);
  const bTime = new Date(b.timestamp || b.createdAt || b.updatedAt || 0);
  return (
    aTime.getFullYear() === bTime.getFullYear() &&
    aTime.getMonth() === bTime.getMonth() &&
    aTime.getDate() === bTime.getDate() &&
    aTime.getHours() === bTime.getHours() &&
    aTime.getMinutes() === bTime.getMinutes()
  );
}

export function linkifyText(text: string) {
  return text.split(URL_REGEX).map((part, i) => {
    if (URL_REGEX.test(part)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'underline', wordBreak: 'break-all' }}>{part}</a>;
    }
    return part;
  });
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp) {
      return decoded.exp < currentTime;
    }
    return false;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

export const getTokenExpirationTime = (token: string): Date | null => {
  try {
    const decoded: any = jwtDecode(token);
    if (decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

export const validateToken = (token: string): { isValid: boolean; isExpired: boolean; decoded?: any } => {
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    const isExpired = decoded.exp ? decoded.exp < currentTime : false;

    return {
      isValid: true,
      isExpired,
      decoded
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return {
      isValid: false,
      isExpired: true
    };
  }
};

export const isAuthenticated = (): boolean => {
  try {
    const token = store?.getState()?.user?.token;
    if (!token) return false;

    const validation = validateToken(token);
    return validation.isValid && !validation.isExpired;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

export const getAuthToken = (): string | null => {
  try {
    const token = store?.getState()?.user?.token;
    if (!token) return null;

    const validation = validateToken(token);
    if (validation.isValid && !validation.isExpired) {
      return token;
    }
    store?.dispatch(clearToken());
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};