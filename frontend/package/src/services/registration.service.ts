import memberService from "./member.service";
import nextOfKinService from "./nextOfKin.service";
import vehicleService from "./vehicle.service";
import guarantorService from "./guarantor.service";
import categoryService from "./category.service";

import { Member } from "@/interfaces/member";
import { MemberCategory } from "@/interfaces/category";
import { NextOfKin } from "@/interfaces/nextOfKin";
import { Vehicle } from "@/interfaces/vehicle";
import { Guarantor } from "@/interfaces/guarantor";
import { RegistrationState } from "@/types/registration";

export interface RegistrationData {
  member: Member;
  category: MemberCategory | null;
  nextOfKin: NextOfKin | null;
  vehicle: Vehicle | null;
  guarantor: Guarantor | null;
}

export interface RegistrationResult {
  member: Member;
  nextOfKin: NextOfKin | null;
  vehicle: Vehicle | null;
  guarantor: Guarantor | null;
  secondaryFailures: string[];
}

class RegistrationService {
  /**
   * Load a complete registration by member ID.
   */
  async loadRegistration(
    memberId: number
  ): Promise<RegistrationData> {
    const member = await memberService.getById(memberId);

    const [
      category,
      nextOfKin,
      vehicle,
      guarantor,
    ] = await Promise.all([
      member.category
        ? categoryService.getById(member.category)
        : Promise.resolve(null),
      nextOfKinService.getByMember(memberId),
      vehicleService.getByMember(memberId),
      guarantorService.getByMember(memberId),
    ]);

    return {
      member,
      category,
      nextOfKin,
      vehicle,
      guarantor,
    };
  }

  /**
   * Clean a string value for API submission.
   */
  private cleanString(value: unknown): string {
    if (typeof value !== "string") {
      return "";
    }
    return value.trim();
  }

  /**
   * Build FormData for member creation from registration state.
   */
  private buildMemberFormData(registration: RegistrationState): FormData {
    const { member } = registration;
    const formData = new FormData();

    formData.append("first_name", this.cleanString(member.first_name));
    formData.append("other_names", this.cleanString(member.other_names));
    formData.append("national_id", this.cleanString(member.national_id));
    formData.append("phone_number", this.cleanString(member.phone_number));

    const email = this.cleanString(member.email);
    if (email) {
      formData.append("email", email);
    }

    const physicalAddress = this.cleanString(member.physical_address);
    if (physicalAddress) {
      formData.append("physical_address", physicalAddress);
    }

    const occupation = this.cleanString(member.occupation);
    if (occupation) {
      formData.append("occupation", occupation);
    }

    const kraPin = this.cleanString(member.kra_pin);
    if (kraPin) {
      formData.append("kra_pin", kraPin);
    }

    formData.append("category", String(member.category));

    // Append only a real local File
    if (member.passport_photo instanceof File) {
      formData.append(
        "passport_photo",
        member.passport_photo,
        member.passport_photo.name
      );
    }

    return formData;
  }

  /**
   * Build payload for next of kin creation/update.
   */
  private buildNextOfKinPayload(
    nextOfKin: RegistrationState["nextOfKin"],
    memberId: number
  ) {
    return {
      member: memberId,
      first_name: this.cleanString(nextOfKin.first_name),
      other_names: this.cleanString(nextOfKin.other_names),
      relationship: this.cleanString(nextOfKin.relationship),
      national_id: this.cleanString(nextOfKin.national_id),
      phone_number: this.cleanString(nextOfKin.phone_number),
      physical_address: this.cleanString(nextOfKin.physical_address),
      is_primary: Boolean(nextOfKin.is_primary),
    };
  }

  /**
   * Build payload for vehicle creation/update.
   */
  private buildVehiclePayload(
    vehicle: RegistrationState["vehicle"],
    memberId: number
  ) {
    return {
      member: memberId,
      registration_number: this.cleanString(vehicle.registration_number),
      make: this.cleanString(vehicle.make),
      model: this.cleanString(vehicle.model),
      year: vehicle.year || null,
      color: this.cleanString(vehicle.color),
      engine_number: this.cleanString(vehicle.engine_number),
      chassis_number: this.cleanString(vehicle.chassis_number),
    };
  }

  /**
   * Build payload for guarantor creation/update.
   */
  private buildGuarantorPayload(
    guarantor: RegistrationState["guarantor"],
    memberId: number
  ) {
    const payload: Record<string, unknown> = {
      member: memberId,
      first_name: this.cleanString(guarantor.first_name),
      other_names: this.cleanString(guarantor.other_names),
      national_id: this.cleanString(guarantor.national_id),
      phone_number: this.cleanString(guarantor.phone_number),
      relationship: this.cleanString(guarantor.relationship),
    };

    if (guarantor.guarantor_member) {
      payload.guarantor_member = guarantor.guarantor_member;
    }

    return payload;
  }

  /**
   * Check if a related record has data.
   */
  private hasData(value: string): boolean {
    return this.cleanString(value).length > 0;
  }

  /**
   * Create a new registration with all related records.
   */
  async createRegistration(
    registration: RegistrationState
  ): Promise<RegistrationResult> {
    const { member, nextOfKin, vehicle, guarantor } = registration;

    // 1. Create the primary member
    const formData = this.buildMemberFormData(registration);
    const createdMember = await memberService.create(formData);

    if (!createdMember || !createdMember.id) {
      throw new Error(
        "The server did not return a valid member ID after creating the member."
      );
    }

    const memberId = createdMember.id;
    const secondaryFailures: string[] = [];

    // 2. Create Next of Kin
    if (this.hasData(nextOfKin.first_name)) {
      try {
        const payload = this.buildNextOfKinPayload(nextOfKin, memberId);
        await nextOfKinService.create(payload);
      } catch (err) {
        console.error("Next of Kin creation failed:", err);
        secondaryFailures.push("Next of Kin");
      }
    }

    // 3. Create Vehicle
    if (this.hasData(vehicle.registration_number)) {
      try {
        const payload = this.buildVehiclePayload(vehicle, memberId);
        await vehicleService.create(payload);
      } catch (err) {
        console.error("Vehicle creation failed:", err);
        secondaryFailures.push("Vehicle");
      }
    }

    // 4. Create Guarantor
    if (this.hasData(guarantor.first_name)) {
      try {
        const payload = this.buildGuarantorPayload(guarantor, memberId);
        await guarantorService.create(payload);
      } catch (err) {
        console.error("Guarantor creation failed:", err);
        secondaryFailures.push("Guarantor");
      }
    }

    return {
      member: createdMember,
      nextOfKin: null,
      vehicle: null,
      guarantor: null,
      secondaryFailures,
    };
  }

  /**
   * Update an existing registration.
   */
  async updateRegistration(
    registration: RegistrationState
  ): Promise<RegistrationResult> {
    const {
      member,
      nextOfKin,
      vehicle,
      guarantor,
    } = registration;

    console.log("Member:", member);
    console.log("Next Of Kin:", nextOfKin);
    console.log("Vehicle:", vehicle);
    console.log("Guarantor:", guarantor);

    if (!member.id) {
      throw new Error("Member ID is required for update.");
    }

    const memberId = member.id;
    const secondaryFailures: string[] = [];

    // 1. Update the primary member
    const formData = this.buildMemberFormData(registration);
    await memberService.update(memberId, formData);

    // 2. Handle Next of Kin (update or create)
    if (this.hasData(nextOfKin.first_name)) {
      try {
        const payload = this.buildNextOfKinPayload(nextOfKin, memberId);

        if (nextOfKin.id) {
          await nextOfKinService.update(nextOfKin.id, payload);
        } else {
          await nextOfKinService.create(payload);
        }
      } catch (err) {
        console.error("Next of Kin update failed:", err);
        secondaryFailures.push("Next of Kin");
      }
    }

    // 3. Handle Vehicle (update or create)
    if (this.hasData(vehicle.registration_number)) {
      try {
        const payload = this.buildVehiclePayload(vehicle, memberId);

        if (vehicle.id) {
          await vehicleService.update(vehicle.id, payload);
        } else {
          await vehicleService.create(payload);
        }
      } catch (err) {
        console.error("Vehicle update failed:", err);
        secondaryFailures.push("Vehicle");
      }
    }

    // 4. Handle Guarantor (update or create)
    if (this.hasData(guarantor.first_name)) {
      try {
        const payload = this.buildGuarantorPayload(guarantor, memberId);

        if (guarantor.id) {
          await guarantorService.update(guarantor.id, payload);
        } else {
          await guarantorService.create(payload);
        }
      } catch (err) {
        console.error("Guarantor update failed:", err);
        secondaryFailures.push("Guarantor");
      }
    }

    // Fetch the updated member
    const updatedMember = await memberService.getById(memberId);

    return {
      member: updatedMember,
      nextOfKin: null,
      vehicle: null,
      guarantor: null,
      secondaryFailures,
    };
  }
}

export default new RegistrationService();