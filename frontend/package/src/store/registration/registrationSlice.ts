import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type {
  RegistrationState,
  MemberState,
  NextOfKinState,
  VehicleState,
  GuarantorState,
} from "@/types/registration";

const initialState: RegistrationState = {
  currentStep: 0,

  member: {
    first_name: "",
    other_names: "",
    national_id: "",
    phone_number: "",
    email: "",
    physical_address: "",
    occupation: "",
    kra_pin: "",
    category: "",
    passport_photo: null,
  },

  nextOfKin: {
    first_name: "",
    other_names: "",
    relationship: "",
    national_id: "",
    phone_number: "",
    physical_address: "",
    is_primary: true,
  },

  vehicle: {
    registration_number: "",
    make: "",
    model: "",
    year: null,
    color: "",
    engine_number: "",
    chassis_number: "",
  },

  guarantor: {
    first_name: "",
    other_names: "",
    national_id: "",
    phone_number: "",
    relationship: "",
    guarantor_member: null,
  },
};

const registrationSlice = createSlice({
  name: "registration",

  initialState,

  reducers: {
    setCurrentStep(state, action: PayloadAction<number>) {
      state.currentStep = action.payload;
    },

    setMember(
      state,
      action: PayloadAction<Partial<MemberState>>
    ) {
      state.member = {
        ...state.member,
        ...action.payload,
      };
    },

    setNextOfKin(
      state,
      action: PayloadAction<Partial<NextOfKinState>>
    ) {
      state.nextOfKin = {
        ...state.nextOfKin,
        ...action.payload,
      };
    },

    setVehicle(
      state,
      action: PayloadAction<Partial<VehicleState>>
    ) {
      state.vehicle = {
        ...state.vehicle,
        ...action.payload,
      };
    },

    setGuarantor(
      state,
      action: PayloadAction<Partial<GuarantorState>>
    ) {
      state.guarantor = {
        ...state.guarantor,
        ...action.payload,
      };
    },

    resetRegistration() {
      // Return a fresh copy of initialState with all nested objects
      return {
        ...initialState,
        member: { ...initialState.member },
        nextOfKin: { ...initialState.nextOfKin },
        vehicle: { ...initialState.vehicle },
        guarantor: { ...initialState.guarantor },
      };
    },
  },
});

export const {
  setCurrentStep,
  setMember,
  setNextOfKin,
  setVehicle,
  setGuarantor,
  resetRegistration,
} = registrationSlice.actions;

export default registrationSlice.reducer;