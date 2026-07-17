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

const editMemberSlice = createSlice({
  name: "editMember",

  initialState,

  reducers: {
    setEditCurrentStep(
      state,
      action: PayloadAction<number>
    ) {
      state.currentStep = action.payload;
    },

    setEditMember(
      state,
      action: PayloadAction<Partial<MemberState>>
    ) {
      state.member = {
        ...state.member,
        ...action.payload,
      };
    },

    setEditNextOfKin(
      state,
      action: PayloadAction<Partial<NextOfKinState>>
    ) {
      state.nextOfKin = {
        ...state.nextOfKin,
        ...action.payload,
      };
    },

    setEditVehicle(
      state,
      action: PayloadAction<Partial<VehicleState>>
    ) {
      state.vehicle = {
        ...state.vehicle,
        ...action.payload,
      };
    },

    setEditGuarantor(
      state,
      action: PayloadAction<Partial<GuarantorState>>
    ) {
      state.guarantor = {
        ...state.guarantor,
        ...action.payload,
      };
    },

    resetEditMember() {
      return initialState;
    },
  },
});

export const {
  setEditCurrentStep,
  setEditMember,
  setEditNextOfKin,
  setEditVehicle,
  setEditGuarantor,
  resetEditMember,
} = editMemberSlice.actions;

export default editMemberSlice.reducer;