package com.fis.vdbas.qtdc.common;

public final class Constants {

    private Constants() {
        // Private constructor to prevent instantiation
    }

    public static final String ADMIN_USERNAME = "qtdc_admin";

    // Security & Cache Prefixes
    public static final String PREFIX_ROLE = "ROLE_";
    public static final String PREFIX_API_PERMISSION = "API:";
    public static final String PREFIX_APP_CACHE = "app_";
    public static final String PREFIX_MENU_CACHE = "menu_";
    public static final String PREFIX_API_CACHE = "api_";

    public static final class Resource {
        public static final String USER = "User";
        public static final String PERSON = "PersonProfile";
        public static final String ORGANIZATION = "OrganizationProfile";

        public static final String SCOPE = "OrganizationMngmtScope";
        public static final String KEYCLOAK = "Keycloak";
        public static final String ENFORCEMENT_AGENCY = "OrganizationEnforcementAgency";
    }

    public static final class ErrorCode {
        public static final String NOT_FOUND = "RESOURCE_NOT_FOUND";
        public static final String DUPLICATE = "DUPLICATE_RESOURCE";
        public static final String ACCESS_DENIED = "ACCESS_DENIED";
        public static final String INVALID_OPERATION = "INVALID_OPERATION";

        public static final String USER_NOT_SYNCED = "USER_NOT_SYNCED";
        public static final String USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS";

        public static final String KEYCLOAK_BAD_REQUEST = "KEYCLOAK_BAD_REQUEST";
        public static final String KEYCLOAK_UNAUTHORIZED = "KEYCLOAK_UNAUTHORIZED";
        public static final String KEYCLOAK_ERROR = "KEYCLOAK_ERROR";
        public static final String KEYCLOAK_CLIENT_ERROR = "KEYCLOAK_CLIENT_ERROR";

        public static final String FILE_IS_NOT_EXCEL = "FILE_IS_NOT_EXCEL";
        public static final String HEADER_IS_NOT_EXIST = "HEADER_IS_NOT_EXIST";
        public static final String FILE_TOO_LARGE = "FILE_TOO_LARGE";

        // Enforcement Agency Error Codes
        public static final String ENFORCEMENT_AGENCY_NOT_FOUND = "ENFORCEMENT_AGENCY_NOT_FOUND";
        public static final String ENFORCEMENT_AGENCY_DUPLICATE = "ENFORCEMENT_AGENCY_DUPLICATE";
        public static final String ENFORCEMENT_AGENCY_ORG_NOT_FOUND = "ENFORCEMENT_AGENCY_ORG_NOT_FOUND";
        public static final String DUPLICATE_ENTRY = "DUPLICATE_ENTRY";
    }

    public static final class MessageKey {

        public static final String IMPORT_GROUP = "error.import.group";

        public static final String USER_NOT_SYNCED = "error.user.not_synced";
        public static final String USER_EXISTS = "error.user.exists";

        public static final String KEYCLOAK_BAD_REQUEST = "error.keycloak.bad_request";
        public static final String KEYCLOAK_UNAUTHORIZED = "error.keycloak.unauthorized";
        public static final String KEYCLOAK_SYSTEM = "error.keycloak.system";
        public static final String KEYCLOAK_CLIENT_CREATE = "error.keycloak.client_create";

        public static final String ACCESS_DENIED_SYSTEM_ADMIN = "error.access_denied.system_admin";
        public static final String ACCESS_DENIED_ADMIN_ONLY = "error.access_denied.admin_only";
        public static final String ACCESS_DENIED_NO_PERMISSION = "error.access_denied.no_permission";
        public static final String ACCESS_DENIED_ORG_NO_PERMISSION = "error.access_denied.org_no_permission";
        public static final String ACCESS_DENIED_USER_NO_PERMISSION = "error.access_denied.user_no_permission";
        public static final String ACCESS_DENIED_PERSON_NO_PERMISSION = "error.access_denied.person_no_permission";
        public static final String ENTITY_NOT_FOUND = "error.entity.notfound";
        public static final String DUPLICATE_ENTRY = "error.duplicate.entry";

        // Enforcement Agency Message Keys
        public static final String ENFORCEMENT_AGENCY_NOT_FOUND = "error.enforcement.agency.notfound";
        public static final String ENFORCEMENT_AGENCY_DUPLICATE = "error.enforcement.agency.duplicate";
        public static final String ENFORCEMENT_AGENCY_ORG_NOT_FOUND = "error.enforcement.agency.org.notfound";
        public static final String ENFORCEMENT_AGENCY_ORG_ALREADY_EXISTS = "error.enforcement.agency.org.already.exists";
        // ISSUING AGENCY MESSAGE
        public static final String ENTITY_DUPLICATE = "error.entity.duplicate";
        public static final String ORG_ISSUING_AGENCY_EMPTY = "error.org_issuing_agency.empty";
    }

    public static final class ErrorMessage {
        public static final String KEYCLOAK_USER_MISSING_EXTERNAL_ID = "User missing externalId (Keycloak ID)";
        public static final String PERMISSION_EXISTS = "Permission already exists.";
        public static final String USER_NOT_AUTHENTICATED = "User not authenticated";
        public static final String CURRENT_USER_NOT_FOUND = "Current user not found";
        public static final String USER_NOT_FOUND = "User not found";
        public static final String PERSON_NOT_FOUND = "Not found person profile.";
        public static final String ORG_NOT_FOUND = "Not found target organization.";
        public static final String MAIN_ORG_NOT_FOUND = "Not found main organization of person.";
        public static final String PARENT_ORG_NOT_FOUND = "Parent organization not found.";
        public static final String SCOPE_NOT_FOUND = "Scope not found.";
        public static final String ORG_ISSUING_AGENCY_DUPLICATE = "Issuing agency already exists";
        public static final String ORG_ISSUING_AGENCY_EMPTY = "Issuing agency list must not be empty";

        public static final String ACCESS_DENIED_SYSTEM_ADMIN = "Only system admin can perform this operation.";
        public static final String ORG_ID_REQUIRED = "Organization ID is required for hierarchical load.";
        public static final String START_DATE_BEFORE_END_DATE = "Start date must be before end date.";
        public static final String ACCESS_DENIED_ADMIN_ONLY = "Only admin can manage users.";
        public static final String ACCESS_DENIED_NO_PERMISSION = "You don't have permission to perform this action.";
        public static final String ACCESS_DENIED_ORG_NO_PERMISSION = "You don't have permission to manage this organization.";
        public static final String ACCESS_DENIED_USER_NO_PERMISSION = "You don't have permission to access this user.";
        public static final String ACCESS_DENIED_PERSON_NO_PERMISSION = "You don't have permission to access this person profile.";

        // Enforcement Agency Error Messages
        public static final String ENFORCEMENT_AGENCY_NOT_FOUND = "Enforcement agency not found.";
        public static final String ENFORCEMENT_AGENCY_ORG_NOT_FOUND = "Organization not found for enforcement agency.";
        public static final String ENFORCEMENT_AGENCY_ORG_ALREADY_EXISTS = "Enforcement agency for this organization already exists.";
    }

}
