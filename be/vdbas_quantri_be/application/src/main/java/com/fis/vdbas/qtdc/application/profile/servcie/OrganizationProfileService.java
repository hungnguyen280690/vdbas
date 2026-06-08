package com.fis.vdbas.qtdc.application.profile.servcie;

import com.fis.vdbas.qtdc.common.Constants;
import com.fis.vdbas.qtdc.application.profile.dto.OrganizationProfileDto;
import com.fis.vdbas.qtdc.application.profile.dto.OrganizationProfileSearchDto;
import com.fis.vdbas.qtdc.application.profile.dto.OrganizationTransformationDto;
import com.fis.vdbas.qtdc.application.profile.mapper.OrganizationProfileMapper;
import com.fis.vdbas.qtdc.domain.profile.OrganizationProfile;
import com.fis.vdbas.qtdc.domain.profile.OrganizationProfileRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import com.fis.vdbas.qtdc.common.CacheConstants;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import com.fis.vdbas.common.util.TokenUtils;
import com.fis.vdbas.qtdc.domain.profile.OrganizationPerson;
import com.fis.vdbas.qtdc.domain.profile.OrganizationPersonRepository;
import com.fis.vdbas.qtdc.domain.profile.OrganizationMngmtScope;
import com.fis.vdbas.qtdc.domain.user.User;
import com.fis.vdbas.qtdc.domain.user.UserRepository;
import com.fis.vdbas.qtdc.application.common.util.ManagementScopeHelper;
import com.fis.vdbas.common.exception.AccessDeniedException;
import com.fis.vdbas.common.exception.ResourceNotFoundException;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.CriteriaBuilder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;
import static com.fis.vdbas.common.util.Constants.FLAG_TRUE;
import java.util.stream.Collectors;

/**
 * Service for managing Organization Profiles.
 * <p>
 * Handles complex business logic for organizations including hierarchical path generation,
 * transformation tracking, and multi-layered security/management scope enforcement.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OrganizationProfileService {

    private final OrganizationProfileRepository repository;
    private final OrganizationProfileMapper mapper;
    private final OrganizationTransformationService organizationTransformationService;
    private final OrganizationPersonRepository organizationPersonRepository;
    private final UserRepository userRepository;
    private final ManagementScopeHelper scopeHelper;

    private User getCurrentUser() {
        String externalId = TokenUtils.getUserId()
                .orElseThrow(() -> new RuntimeException(Constants.ErrorMessage.USER_NOT_AUTHENTICATED));
        return userRepository.findByExternalId(externalId)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.CURRENT_USER_NOT_FOUND));
    }

    /**
     * Searches for organization profiles based on filter criteria and security scopes.
     * <p>
     * Results are sorted by organization code and cached per user to respect security visibility.
     * </p>
     *
     * @param criteria Search and filter parameters
     * @return List of accessible organization profile DTOs
     */
    @Cacheable(value = CacheConstants.ORGANIZATION_CACHE, key = "#criteria.toString() + '_' + T(com.fis.vdbas.qtdc.common.util.TokenUtils).getUserId().orElse('anon')")
    public List<OrganizationProfileDto> search(OrganizationProfileSearchDto criteria) {
        List<OrganizationProfile> profiles = repository.findAll(this.filter(criteria),
                Sort.by(Sort.Direction.ASC, "orgCode"));
        return mapper.toDtoList(profiles);
    }

    // public PageResponseDto<OrganizationProfileDto>
    // search(OrganizationProfileSearchDto criteria) {
    // if (log.isDebugEnabled()) {
    // log.debug("search organization profiles by criteria: {}", criteria);
    // }
    // String sortBy = (criteria.getSortBy() != null &&
    // !criteria.getSortBy().isBlank())
    // ? criteria.getSortBy()
    // : "orgCode";
    // Direction direction = "desc".equalsIgnoreCase(criteria.getSortDirection())
    // ? Direction.DESC
    // : Direction.ASC;

    // Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(),
    // Sort.by(direction, sortBy));
    // Page<OrganizationProfile> page = repository.findAll(this.filter(criteria),
    // pageable);

    // PageResponseDto<OrganizationProfileDto> response =
    // PageResponseDto.<OrganizationProfileDto>builder()
    // .content(mapper.toDtoList(page.getContent()))
    // .page(page.getNumber())
    // .size(page.getSize())
    // .totalElements(page.getTotalElements())
    // .totalPages(page.getTotalPages())
    // .build();
    // if (log.isDebugEnabled()) {
    // log.debug("search result totalElements: {}", response.getTotalElements());
    // }
    // return response;
    // }

    /**
     * Retrieves a specific organization profile by its ID.
     * <p>
     * Includes details of parent organization, administrative unit, and transformation history.
     * Validates that the current user has permission to view the organization.
     * </p>
     *
     * @param id Organization UUID
     * @return Detailed organization profile DTO
     */
    @Cacheable(value = CacheConstants.ORGANIZATION_CACHE, key = "#id")
    public OrganizationProfileDto get(UUID id) {
        validateManagementPermission(id);
        OrganizationProfile entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.ORG_NOT_FOUND));
        OrganizationProfileDto result = mapper.toDto(entity);
        if (result != null) {
            if (entity.getParent() != null) {
                result.setParentCode(entity.getParent().getOrgCode());
                result.setParentName(entity.getParent().getOrgName());
            }
            if (entity.getAdministrativeUnit() != null) {
                result.setUnitCode(entity.getAdministrativeUnit().getUnitCode());
                result.setUnitName(entity.getAdministrativeUnit().getUnitName());
            }

            List<OrganizationTransformationDto> transformations = organizationTransformationService
                    .getAllSourceId(id);
            if (CollectionUtils.isEmpty(transformations)) {
                result.setSourceOrgIds(new ArrayList<>());
            } else {
                result.setSourceOrgIds(transformations.stream().map(OrganizationTransformationDto::getSourceOrgId)
                        .collect(Collectors.toList()));
                result.setTransformationType(transformations.get(0).getTransformationType());
                result.setEffectiveDate(transformations.get(0).getEffectiveDate());
                result.setDecisionNumber(transformations.get(0).getDecisionNumber());
            }
        }
        return result;
    }

    /**
     * Creates a new organization profile.
     * <p>
     * Automatically generates hierarchical paths and handles associated transformation records.
     * Evicts the organization cache upon successful creation.
     * </p>
     *
     * @param input Organization data
     * @return The created organization DTO
     */
    @Transactional
    @CacheEvict(value = CacheConstants.ORGANIZATION_CACHE, allEntries = true)
    public OrganizationProfileDto create(OrganizationProfileDto input) {
        OrganizationProfile entity = mapper.toEntity(input);
        entity.setId(null);
        if (entity.getParentId() == null) {
            entity.setPaths("/" + entity.getOrgCode());
        } else {
            entity.setPaths(generatePaths(entity.getParentId(), entity.getOrgCode()));
        }

        if (entity.getEndDate() == null || entity.getEndDate().isBefore(LocalDateTime.now())) {
            entity.setActive(FLAG_TRUE);
        } else {
            entity.setActive(FLAG_FALSE);
        }

        OrganizationProfileDto result = mapper.toDto(repository.save(entity));

        if (input.getSourceOrgIds() != null) {
            organizationTransformationService.updateOrganizationTransformation(result.getId(),
                    input.getSourceOrgIds(), input.getTransformationType(), input.getDecisionNumber(),
                    input.getEffectiveDate() != null ? input.getEffectiveDate() : input.getStartDate());
        }
        return result;
    }

    /**
     * Updates an existing organization profile.
     * <p>
     * Re-calculates hierarchical paths and updates transformation history.
     * Validates management permissions before applying changes.
     * </p>
     *
     * @param id    Organization UUID
     * @param input Updated organization data
     * @return The updated organization DTO
     */
    @Transactional
    @CacheEvict(value = CacheConstants.ORGANIZATION_CACHE, allEntries = true)
    public OrganizationProfileDto update(UUID id, OrganizationProfileDto input) {
        validateManagementPermission(id);
        OrganizationProfile existing = repository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.ORG_NOT_FOUND));
        mapper.updateEntityFromDto(input, existing);
        existing.setPaths(generatePaths(existing.getParentId(), existing.getOrgCode()));

        if (input.getEndDate() != null && input.getEndDate().isBefore(LocalDateTime.now())) {
            existing.setActive(FLAG_FALSE);
        } else {
            existing.setActive(FLAG_TRUE);
        }

        OrganizationProfileDto result = mapper.toDto(repository.save(existing));

        organizationTransformationService.updateOrganizationTransformation(id,
                input.getSourceOrgIds(), input.getTransformationType(), input.getDecisionNumber(),
                input.getEffectiveDate() != null ? input.getEffectiveDate() : input.getStartDate());

        return result;
    }

    /**
     * Performs a soft-delete on an organization profile.
     * <p>
     * Validates management permissions before deletion and evicts the cache.
     * </p>
     *
     * @param id Organization UUID to delete
     */
    @Transactional
    @CacheEvict(value = CacheConstants.ORGANIZATION_CACHE, allEntries = true)
    public void delete(UUID id) {
        validateManagementPermission(id);
        repository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.ORG_NOT_FOUND));
        repository.softDelete(id);
    }

    private String generatePaths(UUID parentId, String orgCode) {
        if (parentId == null) {
            return "/" + orgCode;
        }
        OrganizationProfile parent = repository.findById(parentId)
                .orElseThrow(() -> new RuntimeException(Constants.ErrorMessage.PARENT_ORG_NOT_FOUND));
        return (parent.getPaths() != null ? parent.getPaths() : "") + "/" + orgCode;
    }

    /**
     * Updates the active status of an organization.
     *
     * @param id     Organization UUID
     * @param active New active status
     * @return The updated organization profile
     */
    @Transactional
    @CacheEvict(value = CacheConstants.ORGANIZATION_CACHE, allEntries = true)
    public OrganizationProfileDto updateActive(UUID id, Boolean active) {
        validateManagementPermission(id);
        repository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.ORG_NOT_FOUND));
        repository.updateActive(id, mapper.booleanToInteger(active));
        return get(id);
    }

    private Specification<OrganizationProfile> filter(OrganizationProfileSearchDto criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            addBasicFilters(predicates, root, cb, criteria);
            addSecurityFilters(predicates, root, cb, criteria);

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void addBasicFilters(List<Predicate> predicates, Root<OrganizationProfile> root, CriteriaBuilder cb,
            OrganizationProfileSearchDto criteria) {
        if (criteria.getOrgCode() != null && !criteria.getOrgCode().isBlank()) {
            predicates.add(
                    cb.like(cb.lower(root.get("orgCode")), "%" + criteria.getOrgCode().toLowerCase() + "%"));
        }

        if (criteria.getOrgName() != null && !criteria.getOrgName().isBlank()) {
            predicates.add(
                    cb.like(cb.lower(root.get("orgName")), "%" + criteria.getOrgName().toLowerCase() + "%"));
        }

        if (criteria.getEmail() != null && !criteria.getEmail().isBlank()) {
            predicates.add(
                    cb.like(cb.lower(root.get("email")), "%" + criteria.getEmail().toLowerCase() + "%"));
        }

        if (criteria.getOrgType() != null && !criteria.getOrgType().isBlank()) {
            predicates.add(cb.equal(root.get("orgType"), criteria.getOrgType()));
        }

        if (criteria.getParentId() != null) {
            predicates.add(cb.equal(root.get("parentId"), criteria.getParentId()));
        } else {
            predicates.add(cb.isNull(root.get("parentId")));
        }

        if (criteria.getUnitId() != null) {
            predicates.add(cb.equal(root.get("unitId"), criteria.getUnitId()));
        }

        if (criteria.getActive() != null) {
            predicates.add(cb.equal(root.get("active"), mapper.booleanToInteger(criteria.getActive())));
        }

        if (criteria.getDeleted() != null) {
            predicates.add(cb.equal(root.get("deleted"), mapper.booleanToInteger(criteria.getDeleted())));
        } else {
            predicates.add(cb.equal(root.get("deleted"), FLAG_FALSE));
        }
    }

    private void addSecurityFilters(List<Predicate> predicates, Root<OrganizationProfile> root, CriteriaBuilder cb,
            OrganizationProfileSearchDto criteria) {
        User currentUser = getCurrentUser();
        if (Constants.ADMIN_USERNAME.equals(currentUser.getUsername())) {
            return;
        }

        ManagementScopeHelper.UserOrgInfo orgInfo = scopeHelper.resolveUserOrgInfo(currentUser);
        log.info("userRealOrgId: {}, userRealOrgPath: {}", orgInfo.realOrgId(), orgInfo.realOrgPath());

        List<Predicate> securityPredicates = new ArrayList<>();

        // 1. Own organization and subordinates
        if (orgInfo.realOrgPath() != null) {
            String pathFilter = (criteria.getParentId() == null) ? getRootPath(orgInfo.realOrgPath())
                    : orgInfo.realOrgPath();
            securityPredicates.add(cb.like(root.get("paths"), pathFilter + "%"));
        }

        // 2. Organization Management Scope configs
        securityPredicates.addAll(scopeHelper.getSecurityPredicates(orgInfo, cb,
                root.get("paths"), root.get("id"), root.get("orgType")));

        log.info("securityPredicates: {}", securityPredicates);

        if (!securityPredicates.isEmpty()) {
            predicates.add(cb.or(securityPredicates.toArray(new Predicate[0])));
        } else {
            // Fallback to own org
            predicates.add(cb.equal(root.get("id"), currentUser.getOwnerId()));
        }
    }

    private String getRootPath(String path) {
        if (path == null || path.isEmpty()) {
            return path;
        }
        int secondSlash = path.indexOf('/', 1);
        return secondSlash > 0 ? path.substring(0, secondSlash) : path;
    }

    private void validateManagementPermission(UUID targetOrgId) {
        User currentUser = getCurrentUser();
        OrganizationProfile targetOrg = repository.findById(targetOrgId)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.ORG_NOT_FOUND));

        if (!scopeHelper.hasManagementPermission(currentUser, targetOrg)) {
            throw new AccessDeniedException(Constants.ErrorCode.ACCESS_DENIED,
                    Constants.MessageKey.ACCESS_DENIED_ORG_NO_PERMISSION,
                    Constants.ErrorMessage.ACCESS_DENIED_ORG_NO_PERMISSION);
        }
    }
}
