import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  token: string | null;
  name: string | null;
  id: string | null;
}

const initialState: UserState = {
  token: null,
  name: null,
  id: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ token: string; name: string; id: string }>) => {
      state.token = action.payload.token;
      state.name = action.payload.name;
      state.id = action.payload.id;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.name = null;
      state.id = null;
    },
    clearToken: (state) => {
      state.token = null;
      state.name = null;
      state.id = null;
    },
  },
});

export const { setUser, setToken, clearToken } = userSlice.actions;
export default userSlice.reducer; 