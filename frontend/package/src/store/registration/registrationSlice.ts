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
  id: null,

  membership_number: "",

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
   * Populated after selecting
   * a member category.
   */
  category_details: null,

  /*
   * Supports:
   * - new upload (File)
   * - existing image URL (string)
   */
  passport_photo: null,

  /*
   * Backend controlled.
   */
  status: "",

  registration_stage: "",

  // Audit fields
  created_by: null,
  created_by_username: "",
  created_at: null,

  updated_by: null,
  updated_by_username: "",
  updated_at: null,

  approved_by: null,
  approved_by_username: "",
  approved_at: null,

  rejected_by: null,
  rejected_by_username: "",
  rejected_at: null,

  activated_by: null,
  activated_by_username: "",
  activated_at: null,
});

const createInitialNextOfKinState =
  (): NextOfKinState => ({
    id: null,

    member: null,

    first_name: "",
    other_names: "",
    relationship: "",
    national_id: "",
    phone_number: "",
    physical_address: "",

    is_primary: true,
  });

const createInitialVehicleState =
  (): VehicleState => ({
    id: null,

    member: null,

    registration_number: "",
    make: "",
    model: "",

    year: null,

    color: "",

    engine_number: "",
    chassis_number: "",
  });

const createInitialGuarantorState =
  (): GuarantorState => ({
    id: null,

    member: null,

    first_name: "",
    other_names: "",

    national_id: "",

    phone_number: "",

    relationship: "",

    guarantor_member: null,
  });

const createInitialState =
  (): RegistrationState => ({
    currentStep: 0,

    member: createInitialMemberState(),

    nextOfKin: createInitialNextOfKinState(),
    nextOfKins: [],

    vehicle: createInitialVehicleState(),
    vehicles: [],

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
       NEXT OF KIN (SINGLE & MULTI)
    ===================================================== */

    setNextOfKin(
      state,
      action: PayloadAction<
        Partial<NextOfKinState>
      >,
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

    setNextOfKins(
      state,
      action: PayloadAction<NextOfKinState[]>,
    ) {
      state.nextOfKins = action.payload;
      if (action.payload.length > 0) {
        state.nextOfKin = action.payload[0];
      }
    },

    addNextOfKin(
      state,
      action: PayloadAction<NextOfKinState>,
    ) {
      state.nextOfKins.push(action.payload);
      if (state.nextOfKins.length === 1 || action.payload.is_primary) {
        state.nextOfKin = action.payload;
      }
    },

    updateNextOfKin(
      state,
      action: PayloadAction<{ index: number; data: NextOfKinState }>,
    ) {
      const { index, data } = action.payload;
      if (index >= 0 && index < state.nextOfKins.length) {
        state.nextOfKins[index] = data;
        if (index === 0 || data.is_primary) {
          state.nextOfKin = data;
        }
      }
    },

    removeNextOfKin(
      state,
      action: PayloadAction<number>,
    ) {
      const index = action.payload;
      if (index >= 0 && index < state.nextOfKins.length) {
        state.nextOfKins.splice(index, 1);
        if (state.nextOfKins.length > 0) {
          state.nextOfKin = state.nextOfKins[0];
        } else {
          state.nextOfKin = createInitialNextOfKinState();
        }
      }
    },

    /* =====================================================
       VEHICLE (SINGLE & MULTI)
    ===================================================== */

    setVehicle(
      state,
      action: PayloadAction<
        Partial<VehicleState>
      >,
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

    setVehicles(
      state,
      action: PayloadAction<VehicleState[]>,
    ) {
      state.vehicles = action.payload;
      if (action.payload.length > 0) {
        state.vehicle = action.payload[0];
      }
    },

    addVehicle(
      state,
      action: PayloadAction<VehicleState>,
    ) {
      state.vehicles.push(action.payload);
      if (state.vehicles.length === 1) {
        state.vehicle = action.payload;
      }
    },

    updateVehicle(
      state,
      action: PayloadAction<{ index: number; data: VehicleState }>,
    ) {
      const { index, data } = action.payload;
      if (index >= 0 && index < state.vehicles.length) {
        state.vehicles[index] = data;
        if (index === 0) {
          state.vehicle = data;
        }
      }
    },

    removeVehicle(
      state,
      action: PayloadAction<number>,
    ) {
      const index = action.payload;
      if (index >= 0 && index < state.vehicles.length) {
        state.vehicles.splice(index, 1);
        if (state.vehicles.length > 0) {
          state.vehicle = state.vehicles[0];
        } else {
          state.vehicle = createInitialVehicleState();
        }
      }
    },

    /* =====================================================
       GUARANTOR
    ===================================================== */

    setGuarantor(
      state,
      action: PayloadAction<
        Partial<GuarantorState>
      >,
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
  setNextOfKins,
  addNextOfKin,
  updateNextOfKin,
  removeNextOfKin,

  setVehicle,
  replaceVehicle,
  clearVehicle,
  setVehicles,
  addVehicle,
  updateVehicle,
  removeVehicle,

  setGuarantor,
  replaceGuarantor,
  clearGuarantor,

  resetRegistration,
} = registrationSlice.actions;

export default registrationSlice.reducer;