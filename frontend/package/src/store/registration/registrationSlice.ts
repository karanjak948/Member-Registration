import {
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

import type {
  RegistrationState,
  MemberState,
  NextOfKinState,
  VehicleState,
  GuarantorState,
} from "@/types/registration";

/* =========================================================
   INITIAL STATE FACTORIES
========================================================= */

const createInitialMemberState = (): MemberState => ({
  first_name: "",
  other_names: "",
  national_id: "",
  phone_number: "",
  email: "",
  physical_address: "",
  occupation: "",
  kra_pin: "",

  category: "",

  /*
   * Workflow metadata.
   *
   * Populated when Member Details is completed.
   */
  category_details: null,

  passport_photo: null,
});

const createInitialNextOfKinState = (): NextOfKinState => ({
  first_name: "",
  other_names: "",
  relationship: "",
  national_id: "",
  phone_number: "",
  physical_address: "",
  is_primary: true,
});

const createInitialVehicleState = (): VehicleState => ({
  registration_number: "",
  make: "",
  model: "",
  year: null,
  color: "",
  engine_number: "",
  chassis_number: "",
});

const createInitialGuarantorState = (): GuarantorState => ({
  first_name: "",
  other_names: "",
  national_id: "",
  phone_number: "",
  relationship: "",
  guarantor_member: null,
});

const createInitialState = (): RegistrationState => ({
  currentStep: 0,

  member: createInitialMemberState(),

  nextOfKin: createInitialNextOfKinState(),

  vehicle: createInitialVehicleState(),

  guarantor: createInitialGuarantorState(),
});

const initialState: RegistrationState =
  createInitialState();

/* =========================================================
   SLICE
========================================================= */

const registrationSlice = createSlice({
  name: "registration",

  initialState,

  reducers: {
    /* =====================================================
       WIZARD
    ===================================================== */

    setCurrentStep(
      state,
      action: PayloadAction<number>,
    ) {
      state.currentStep = action.payload;
    },

    /* =====================================================
       MEMBER
    ===================================================== */

    setMember(
      state,
      action: PayloadAction<Partial<MemberState>>,
    ) {
      Object.assign(
        state.member,
        action.payload,
      );
    },

    replaceMember(
      state,
      action: PayloadAction<MemberState>,
    ) {
      state.member = action.payload;
    },

    clearMember(state) {
      state.member =
        createInitialMemberState();
    },

    /* =====================================================
       NEXT OF KIN
    ===================================================== */

    setNextOfKin(
      state,
      action: PayloadAction<Partial<NextOfKinState>>,
    ) {
      Object.assign(
        state.nextOfKin,
        action.payload,
      );
    },

    replaceNextOfKin(
      state,
      action: PayloadAction<NextOfKinState>,
    ) {
      state.nextOfKin = action.payload;
    },

    clearNextOfKin(state) {
      state.nextOfKin =
        createInitialNextOfKinState();
    },

    /* =====================================================
       VEHICLE
    ===================================================== */

    setVehicle(
      state,
      action: PayloadAction<Partial<VehicleState>>,
    ) {
      Object.assign(
        state.vehicle,
        action.payload,
      );
    },

    replaceVehicle(
      state,
      action: PayloadAction<VehicleState>,
    ) {
      state.vehicle = action.payload;
    },

    clearVehicle(state) {
      state.vehicle =
        createInitialVehicleState();
    },

    /* =====================================================
       GUARANTOR
    ===================================================== */

    setGuarantor(
      state,
      action: PayloadAction<Partial<GuarantorState>>,
    ) {
      Object.assign(
        state.guarantor,
        action.payload,
      );
    },

    replaceGuarantor(
      state,
      action: PayloadAction<GuarantorState>,
    ) {
      state.guarantor = action.payload;
    },

    clearGuarantor(state) {
      state.guarantor =
        createInitialGuarantorState();
    },

    /* =====================================================
       RESET
    ===================================================== */

    resetRegistration() {
      return createInitialState();
    },
  },
});

export const {
  setCurrentStep,

  setMember,
  replaceMember,
  clearMember,

  setNextOfKin,
  replaceNextOfKin,
  clearNextOfKin,

  setVehicle,
  replaceVehicle,
  clearVehicle,

  setGuarantor,
  replaceGuarantor,
  clearGuarantor,

  resetRegistration,
} = registrationSlice.actions;

export default registrationSlice.reducer;