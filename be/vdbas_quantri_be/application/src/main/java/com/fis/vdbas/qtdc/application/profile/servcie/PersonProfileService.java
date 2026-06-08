package com.fis.vdbas.qtdc.application.profile.servcie;

import com.fis.vdbas.qtdc.common.Constants;
import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.qtdc.application.profile.dto.PersonProfileDto;
import com.fis.vdbas.qtdc.application.profile.dto.PersonProfileLoadDto;
import com.fis.vdbas.qtdc.application.profile.dto.PersonProfileSearchDto;
import com.fis.vdbas.qtdc.application.profile.mapper.PersonProfileMapper;
import com.fis.vdbas.qtdc.domain.profile.PersonProfile;
import com.fis.vdbas.qtdc.domain.profile.PersonProfileRepository;
import com.fis.vdbas.qtdc.domain.profile.OrganizationPerson;
import com.fis.vdbas.qtdc.domain.profile.OrganizationPersonRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fis.vdbas.common.util.TokenUtils;
import com.fis.vdbas.qtdc.domain.profile.OrganizationProfile;
import com.fis.vdbas.qtdc.domain.profile.OrganizationProfileRepository;
import com.fis.vdbas.qtdc.application.common.util.ManagementScopeHelper;
import com.fis.vdbas.qtdc.domain.user.User;
import com.fis.vdbas.qtdc.domain.user.UserRepository;
import com.fis.vdbas.common.exception.AccessDeniedException;
import com.fis.vdbas.common.exception.ResourceNotFoundException;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Subquery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;
import static com.fis.vdbas.common.util.Constants.FLAG_TRUE;
import java.util.stream.Collectors;

/**
 * Service for managing Person Profiles.
 * <p>
 * Handles complex business logic for personal data, including searchable listings
 * with security filters, hierarchical organization-based loading, and lifecycle
 * management of organization assignments (position, department, status).
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PersonProfileService {

    private final PersonProfileRepository personRepository;
    private final PersonProfileMapper mapper;
    private final OrganizationPersonRepository organizationPersonRepository;
    private final UserRepository userRepository;
    private final OrganizationProfileRepository organizationRepository;
    private final ManagementScopeHelper scopeHelper;

    private User getCurrentUser() {
        String externalId = TokenUtils.getUserId()
                .orElseThrow(() -> new RuntimeException(Constants.ErrorMessage.USER_NOT_AUTHENTICATED));
        return userRepository.findByExternalId(externalId)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.CURRENT_USER_NOT_FOUND));
    }

    /**
     * Searches for person profiles with pagination, filtering, and security enforcement.
     * <p>
     * Enriches the results with details of the person's primary organization assignment.
     * </p>
     *
     * @param criteria Search and pagination parameters
     * @return Paginated response of person profile DTOs
     */
    @Transactional(readOnly = true)
    public PageResponseDto<PersonProfileDto> search(PersonProfileSearchDto criteria) {
        String sortBy = (criteria.getSortBy() != null && !criteria.getSortBy().isBlank())
                ? criteria.getSortBy()
                : "fullName";
        Direction direction = "desc".equalsIgnoreCase(criteria.getSortDirection())
                ? Direction.DESC
                : Direction.ASC;

        Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(), Sort.by(direction, sortBy));
        Page<PersonProfile> page = personRepository.findAll(this.filter(criteria), pageable);

        PageResponseDto<PersonProfileDto> response = PageResponseDto.<PersonProfileDto>builder()
                .content(mapper.toDtoList(page.getContent()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();

        if (!response.getContent().isEmpty()) {
            Set<UUID> personIds = response.getContent().stream()
                    .map(PersonProfileDto::getId)
                    .collect(Collectors.toSet());

            Map<UUID, OrganizationPerson> opMap = organizationPersonRepository
                    .findAllByPersonIdInAndMainTrueAndActiveTrue(personIds)
                    .stream()
                    .collect(Collectors.toMap(OrganizationPerson::getPersonId, op -> op, (op1, op2) -> op1));

            response.getContent().forEach(dto -> {
                OrganizationPerson op = opMap.get(dto.getId());
                if (op != null) {
                    dto.setOrgId(op.getOrgId());
                    if (op.getOrganization() != null) {
                        dto.setOrgCode(op.getOrganization().getOrgCode());
                        dto.setOrgName(op.getOrganization().getOrgName());
                    }
                    dto.setPositionCode(op.getPositionCode());
                    dto.setPositionName(op.getPositionName());
                }
            });
        }

        return response;
    }

    /**
     * Loads a list of person profiles within a specific organization hierarchy.
     * <p>
     * Validates management permissions for the target organization before loading.
     * </p>
     *
     * @param criteria Organization ID and load parameters
     * @return List of person profile DTOs
     */
    @Transactional(readOnly = true)
    public List<PersonProfileDto> load(PersonProfileLoadDto criteria) {

        if (criteria.getOrgId() == null) {
            throw new IllegalArgumentException(Constants.ErrorMessage.ORG_ID_REQUIRED);
        }

        // --- Security Check: Hierarchy Load ---
        User currentUser = getCurrentUser();
        if (!Constants.ADMIN_USERNAME.equals(currentUser.getUsername())) {
            // Must have permission for the specific orgId
            OrganizationProfile targetOrg = organizationRepository.findById(criteria.getOrgId())
                    .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                            Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.ORG_NOT_FOUND));
            if (!scopeHelper.hasManagementPermission(currentUser, targetOrg)) {
                throw new AccessDeniedException(Constants.ErrorCode.ACCESS_DENIED,
                        Constants.MessageKey.ACCESS_DENIED_NO_PERMISSION,
                        Constants.ErrorMessage.ACCESS_DENIED_NO_PERMISSION);
            }
        }

        List<OrganizationPerson> assignments = organizationPersonRepository.findAllByHierarchy(criteria.getOrgId());
        return mapper.fromOrganizationPersonList(assignments);
    }

    /**
     * Retrieves details of a specific person profile.
     * <p>
     * Includes current organizational assignment details. Validates access rights.
     * </p>
     *
     * @param id Person UUID
     * @return Person profile DTO
     */
    public PersonProfileDto get(UUID id) {
        validatePersonAccess(id);
        PersonProfile entity = personRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.PERSON_NOT_FOUND));
        PersonProfileDto result = mapper.toDto(entity);

        organizationPersonRepository.findByPersonIdAndMainTrueAndActiveTrue(id)
                .ifPresent(op -> {
                    result.setOrgId(op.getOrgId());
                    if (op.getOrganization() != null) {
                        result.setOrgCode(op.getOrganization().getOrgCode());
                        result.setOrgName(op.getOrganization().getOrgName());
                    }
                    result.setPositionCode(op.getPositionCode());
                    result.setPositionName(op.getPositionName());
                });

        return result;
    }

    /**
     * Creates a new person profile and establishes their initial organization assignment.
     *
     * @param input Person and assignment data
     * @return The created person DTO
     */
    @Transactional
    public PersonProfileDto create(PersonProfileDto input) {
        PersonProfile entity = mapper.toEntity(input);
        entity.setId(null);
        PersonProfile saved = personRepository.save(entity);

        this.updateOrganizationAssignment(saved.getId(), input);

        PersonProfileDto result = mapper.toDto(saved);
        result.setOrgId(input.getOrgId());
        result.setPositionName(input.getPositionName());

        return result;
    }

    /**
     * Updates an existing person profile and their organizational assignment.
     *
     * @param id    Person UUID
     * @param input Updated person data
     * @return The updated person DTO
     */
    @Transactional
    public PersonProfileDto update(UUID id, PersonProfileDto input) {
        validatePersonAccess(id);
        PersonProfile existing = personRepository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.PERSON_NOT_FOUND));
        mapper.updateEntityFromDto(input, existing);
        PersonProfile saved = personRepository.save(existing);

        this.updateOrganizationAssignment(id, input);

        PersonProfileDto result = mapper.toDto(saved);
        result.setOrgId(input.getOrgId());
        result.setPositionName(input.getPositionName());

        return result;
    }

    /**
     * Updates the active status of a person profile.
     *
     * @param id     Person UUID
     * @param active New active status
     */
    @Transactional
    public void updateActive(UUID id, Boolean active) {
        validatePersonAccess(id);
        personRepository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.PERSON_NOT_FOUND));
        personRepository.updateActive(id, mapper.booleanToInteger(active));
    }

    /**
     * Soft-deletes a person profile and terminates their active organizational assignments.
     *
     * @param id Person UUID to delete
     */
    @Transactional
    public void delete(UUID id) {
        validatePersonAccess(id);
        personRepository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.PERSON_NOT_FOUND));
        personRepository.softDelete(id);
        organizationPersonRepository.findByPersonIdAndMainTrueAndActiveTrue(id)
                .ifPresent(op -> {
                    op.setActive(FLAG_FALSE);
                    op.setEndDate(java.time.LocalDate.now());
                    organizationPersonRepository.save(op);
                });
    }

    private void updateOrganizationAssignment(UUID personId, PersonProfileDto input) {
        if (input.getOrgId() == null) {
            return;
        }

        java.time.LocalDate today = java.time.LocalDate.now();

        organizationPersonRepository.findByPersonIdAndMainTrueAndActiveTrue(personId)
                .ifPresent(op -> {
                    // Check if the record is still valid by time
                    boolean isTimeValid = op.getEndDate() == null || op.getEndDate().isAfter(today);

                    if (isTimeValid && op.getOrgId().equals(input.getOrgId())) {
                        op.setPositionCode(input.getPositionCode());
                        op.setPositionName(input.getPositionName());
                        organizationPersonRepository.save(op);
                    } else if (isTimeValid) {
                        // Deactivate old record but keep main=true for history as requested
                        op.setActive(FLAG_FALSE);
                        // Ensure startDate < endDate
                        if (op.getStartDate() != null && !op.getStartDate().isBefore(today)) {
                            op.setEndDate(today.plusDays(1));
                        } else {
                            op.setEndDate(today);
                        }
                        organizationPersonRepository.save(op);
                        this.createOrganizationPerson(personId, input);
                    }
                });

        // If no active main record was found, or we just deactivated one,
        // we might still need to check if there are ANY other records that might
        // conflict
        // (though with the single-active-main rule, finding one above is usually
        // enough).
        if (organizationPersonRepository.findByPersonIdAndMainTrueAndActiveTrue(personId).isEmpty()) {
            this.createOrganizationPerson(personId, input);
        }
    }

    private void createOrganizationPerson(UUID personId, PersonProfileDto input) {
        OrganizationPerson newOp = new OrganizationPerson();
        newOp.setPersonId(personId);
        newOp.setOrgId(input.getOrgId());
        newOp.setPositionCode(input.getPositionCode());
        newOp.setPositionName(input.getPositionName());
        newOp.setMain(FLAG_TRUE);
        newOp.setActive(FLAG_TRUE);
        newOp.setStartDate(java.time.LocalDate.now());
        newOp.setEndDate(null);

        // Final validation
        if (newOp.getEndDate() != null && !newOp.getStartDate().isBefore(newOp.getEndDate())) {
            throw new IllegalArgumentException(Constants.ErrorMessage.START_DATE_BEFORE_END_DATE);
        }

        organizationPersonRepository.save(newOp);
    }

    private Specification<PersonProfile> filter(PersonProfileSearchDto criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            addBasicFilters(predicates, root, cb, criteria);
            addSecurityFilters(predicates, root, query, cb);

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void addBasicFilters(List<Predicate> predicates, Root<PersonProfile> root, CriteriaBuilder cb,
            PersonProfileSearchDto criteria) {
        if (criteria.getFullName() != null && !criteria.getFullName().isBlank()) {
            predicates.add(
                    cb.like(cb.lower(root.get("fullName")), "%" + criteria.getFullName().toLowerCase() + "%"));
        }

        if (criteria.getEmail() != null && !criteria.getEmail().isBlank()) {
            predicates.add(
                    cb.like(cb.lower(root.get("email")), "%" + criteria.getEmail().toLowerCase() + "%"));
        }

        if (criteria.getPhone() != null && !criteria.getPhone().isBlank()) {
            predicates.add(
                    cb.like(cb.lower(root.get("phone")), "%" + criteria.getPhone().toLowerCase() + "%"));
        }

        if (criteria.getIdentityNumber() != null && !criteria.getIdentityNumber().isBlank()) {
            predicates.add(
                    cb.like(cb.lower(root.get("identityNumber")),
                            "%" + criteria.getIdentityNumber().toLowerCase() + "%"));
        }

        if (criteria.getGender() != null && !criteria.getGender().isBlank()) {
            predicates.add(cb.equal(root.get("gender"), criteria.getGender()));
        }

        if (criteria.getInternal() != null) {
            predicates.add(cb.equal(root.get("internal"), mapper.booleanToInteger(criteria.getInternal())));
        }

        if (criteria.getDeleted() != null) {
            predicates.add(cb.equal(root.get("deleted"), mapper.booleanToInteger(criteria.getDeleted())));
        } else {
            predicates.add(cb.equal(root.get("deleted"), FLAG_FALSE));
        }

        if (criteria.getActive() != null) {
            predicates.add(cb.equal(root.get("active"), mapper.booleanToInteger(criteria.getActive())));
        }
    }

    private void addSecurityFilters(List<Predicate> predicates, Root<PersonProfile> root, CriteriaQuery<?> query,
            CriteriaBuilder cb) {
        User currentUser = getCurrentUser();
        if (Constants.ADMIN_USERNAME.equals(currentUser.getUsername())) {
            return;
        }

        Subquery<UUID> subquery = query.subquery(UUID.class);
        Root<OrganizationPerson> opRoot = subquery.from(OrganizationPerson.class);
        Join<OrganizationPerson, OrganizationProfile> orgJoin = opRoot.join("organization");

        ManagementScopeHelper.UserOrgInfo orgInfo = scopeHelper.resolveUserOrgInfo(currentUser);
        log.info("PersonProfile Filter - userRealOrgId: {}, userRealOrgPath: {}", orgInfo.realOrgId(),
                orgInfo.realOrgPath());

        List<Predicate> securityPredicates = scopeHelper.getSecurityPredicates(orgInfo, cb,
                orgJoin.get("paths"), opRoot.get("orgId"), orgJoin.get("orgType"));

        if (!securityPredicates.isEmpty()) {
            subquery.select(opRoot.get("personId"))
                    .where(cb.and(cb.equal(opRoot.get("active"), FLAG_TRUE),
                            cb.or(securityPredicates.toArray(new Predicate[0]))));
            predicates.add(cb.in(root.get("id")).value(subquery));
        } else if (orgInfo.realOrgId() != null) {
            subquery.select(opRoot.get("personId"))
                    .where(cb.and(cb.equal(opRoot.get("active"), FLAG_TRUE),
                            cb.equal(opRoot.get("orgId"), orgInfo.realOrgId())));
            predicates.add(cb.in(root.get("id")).value(subquery));
        } else {
            predicates.add(cb.equal(root.get("id"), currentUser.getOwnerId()));
        }
    }

    private void validatePersonAccess(UUID personId) {
        User currentUser = getCurrentUser();
        // Superadmin bypass
        if (Constants.ADMIN_USERNAME.equals(currentUser.getUsername())) {
            return;
        }

        // Find the person's main organization
        OrganizationPerson assignment = organizationPersonRepository.findByPersonIdAndMainTrueAndActiveTrue(personId)
                .orElse(null);

        if (assignment == null) {
            // If person has no org assignment, check if the person is the current user
            // themselves
            if (!personId.equals(currentUser.getOwnerId())) {
                throw new AccessDeniedException(Constants.ErrorCode.ACCESS_DENIED,
                        Constants.MessageKey.ACCESS_DENIED_USER_NO_PERMISSION,
                        Constants.ErrorMessage.ACCESS_DENIED_PERSON_NO_PERMISSION);
            }
            return;
        }

        if (!scopeHelper.hasManagementPermission(currentUser, assignment.getOrganization())) {
            // Final fallback: Check if the person is the current user themselves
            if (!personId.equals(currentUser.getOwnerId())) {
                throw new AccessDeniedException(Constants.ErrorCode.ACCESS_DENIED,
                        Constants.MessageKey.ACCESS_DENIED_USER_NO_PERMISSION,
                        Constants.ErrorMessage.ACCESS_DENIED_PERSON_NO_PERMISSION);
            }
        }
    }
}
