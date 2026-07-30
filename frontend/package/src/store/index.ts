import { configureStore } from "@reduxjs/toolkit";

import registrationReducer from "./registration/registrationSlice";

export const store = configureStore({
  reducer: {
    registration: registrationReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: [
          "registration.member.passport_photo",
        ],
        ignoredActionPaths: [
          "payload.passport_photo",
        ],
      },
    }),

  devTools:
    process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<
  typeof store.getState
>;

export type AppDispatch = typeof store.dispatch;