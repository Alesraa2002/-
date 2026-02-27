export type Role = 'SUBMITTER' | 'FIELD_COORDINATOR' | 'RELIEF_MANAGER' | 'PROGRAM_DIRECTOR';

export interface BeneficiaryForm {
  id?: number;
  // Section 1: Beneficiary Data
  beneficiaryName: string;
  address: string;
  idNumber: string;
  familyCount: number;
  phone: string;
  isMainBreadwinner: boolean;
  maritalStatus: 'SINGLE' | 'MARRIED' | 'WIDOWED' | 'DIVORCED';
  submissionDate: string;
  wifeName?: string;
  wifeIdNumber?: string;
  
  // Medical Reports (JSON string of {name, data})
  medicalReports?: string;

  // Section 2: Access Channel
  accessChannel: string; // JSON string
  officeLocation?: string;
  referralDetails?: string;

  // Section 3: Problem Description
  problemDescription: string; // JSON string
  problemOther?: string;

  // Section 4: Declaration
  submitterName: string;
  submitterSignature: string;

  // Section 5: Field Coordinator Report
  fieldVisitDate?: string;
  fieldReport?: string;
  fieldDecision?: 'APPROVED' | 'REJECTED';
  fieldAidType?: string;
  fieldRejectionReason?: string;
  fieldCoordinatorName?: string;

  // Section 6: Relief Program Manager Review
  reliefManagerDecision?: 'APPROVED' | 'REJECTED';
  reliefManagerReason?: string;
  reliefManagerSignature?: string;
  reliefManagerName?: string;

  // Section 7: Program Director Final Approval
  directorApproval?: 'APPROVED' | 'REJECTED';
  directorReason?: string;
  directorName?: string;
  directorSignature?: string;
  directorStamp?: string;
  directorStampImage?: string; // Base64 image
  institutionHeaderImage?: string; // Base64 image
  directorDate?: string;

  status: 'PENDING' | 'FIELD_REVIEW_PENDING' | 'RELIEF_MANAGER_PENDING' | 'DIRECTOR_PENDING' | 'COMPLETED';
}
