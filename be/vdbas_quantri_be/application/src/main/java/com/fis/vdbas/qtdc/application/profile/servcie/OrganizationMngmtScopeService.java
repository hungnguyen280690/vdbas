package com.fis.vdbas.qtdc.application.profile.servcie;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.qtdc.application.profile.dto.OrganizationMngmtScopeDto;
import com.fis.vdbas.qtdc.application.profile.dto.OrganizationMngmtScopeSearchDto;
import com.fis.vdbas.qtdc.application.profile.mapper.OrganizationMngmtScopeMapper;
import com.fis.vdbas.qtdc.domain.profile.OrganizationMngmtScope;
import com.fis.vdbas.qtdc.domain.profile.OrganizationMngmtScopeRepository;
import jakarta.persistence.criteria.Predicate;
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
import com.fis.vdbas.qtdc.common.Constants;
import com.fis.vdbas.common.util.TokenUtils;
import com.fis.vdbas.common.util.TokenUtils;
import com.fis.vdbas.qtdc.domain.profile.OrganizationProfile;
import com.fis.vdbas.qtdc.domain.profile.OrganizationProfileRepository;
import com.fis.vdbas.qtdc.domain.user.User;
import com.fis.vdbas.qtdc.domain.user.UserRepository;
import com.fis.vdbas.qtdc.application.common.util.ManagementScopeHelper;
import com.fis.vdbas.common.exception.AccessDeniedException;
import com.fis.vdbas.common.exception.ResourceNotFoundException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;
import static com.fis.vdbas.common.util.Constants.FLAG_TRUE;

/**
 * Service for managing Organization Management Scopes.
 * <p>
 * Handles the business logic for defining and enforcing administrative authority
 * between organizations. Includes permission validation based on the current user's
 * organizational context.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OrganizationMngmtScopeService {

    private final OrganizationMngmtScopeRepository repository;
    private final OrganizationMngmtScopeMapper mapper;
    private final OrganizationProfileRepository organizationRepository;
    private final UserRepository userRepository;
    private final ManagementScopeHelper scopeHelper;

    private User getCurrentUser() {
        String externalId = TokenUtils.getUserId()
                .orElseThrow(() -> new RuntimeException(Constants.ErrorMessage.USER_NOT_AUTHENTICATED));
        return userRepository.findByExternalId(externalId)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.CURRENT_USER_NOT_FOUND));
    }

    // public List<OrganizationMngmtScopeDto> findAll() {
    // return mapper.toDtoList(repository.findAll());
    // }

    /**
     * Finds all management scopes for a specific manager organization.
     *
     * @param managerOrgId The ID of the organization that has management authority
     * @return List of management scope DTOs
     */
    public List<OrganizationMngmtScopeDto> findByManagerOrgId(UUID managerOrgId) {
        validateManagementPermission(managerOrgId);
        return mapper
                .toDtoList(repository.findAll((root, query, cb) -> cb.equal(root.get("managerOrgId"), managerOrgId)));
    }

    /**
     * Searches for organization management scopes with pagination and filtering.
     *
     * @param criteria Search and pagination criteria
     * @return Paginated response of management scope DTOs
     */
    public PageResponseDto<OrganizationMngmtScopeDto> search(OrganizationMngmtScopeSearchDto criteria) {

        String sortBy = (criteria.getSortBy() != null && !criteria.getSortBy().isBlank())
                ? criteria.getSortBy()
                : "id";
        Direction direction = "desc".equalsIgnoreCase(criteria.getSortDirection())
                ? Direction.DESC
                : Direction.ASC;

        Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(), Sort.by(direction, sortBy));
        Page<OrganizationMngmtScope> page = repository.findAll(this.filter(criteria), pageable);

        PageResponseDto<OrganizationMngmtScopeDto> response = PageResponseDto.<OrganizationMngmtScopeDto>builder()
                .content(mapper.toDtoList(page.getContent()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
        return response;
    }

    /**
     * Retrieves details of a specific management scope by its ID.
     *
     * @param id Scope UUID
     * @return Management scope DTO
     */
    public OrganizationMngmtScopeDto get(UUID id) {
        OrganizationMngmtScope entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.SCOPE_NOT_FOUND));
        validateManagementPermission(entity.getManagerOrgId());
        return mapper.toDto(entity);
    }

    /**
     * Creates a new organization management scope.
     * <p>
     * Validates that the current user has permission to manage the specified manager organization.
     * </p>
     *
     * @param input Scope data to create
     * @return The created scope DTO
     */
    @Transactional
    public OrganizationMngmtScopeDto create(OrganizationMngmtScopeDto input) {
        validateManagementPermission(input.getManagerOrgId());
        OrganizationMngmtScope entity = mapper.toEntity(input);
        return mapper.toDto(repository.save(entity));
    }

    /**
     * Updates an existing organization management scope.
     *
     * @param id    Scope UUID
     * @param input Updated scope data
     * @return The updated scope DTO
     */
    @Transactional
    public OrganizationMngmtScopeDto update(UUID id, OrganizationMngmtScopeDto input) {
        OrganizationMngmtScope existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.SCOPE_NOT_FOUND));
        validateManagementPermission(existing.getManagerOrgId());
        validateManagementPermission(input.getManagerOrgId());

        mapper.updateEntityFromDto(input, existing);
        return mapper.toDto(repository.save(existing));
    }

    /**
     * Deletes an organization management scope.
     *
     * @param id Scope UUID to delete
     */
    @Transactional
    public void delete(UUID id) {
        OrganizationMngmtScope existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.SCOPE_NOT_FOUND));
        validateManagementPermission(existing.getManagerOrgId());
        repository.deleteById(id);
    }

    private Specification<OrganizationMngmtScope> filter(OrganizationMngmtScopeSearchDto criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getManagerOrgId() != null) {
                predicates.add(cb.equal(root.get("managerOrgId"), criteria.getManagerOrgId()));
            }

            if (criteria.getTargetOrgType() != null && !criteria.getTargetOrgType().isBlank()) {
                predicates.add(cb.equal(root.get("targetOrgType"), criteria.getTargetOrgType()));
            }

            if (criteria.getTargetOrgId() != null) {
                predicates.add(cb.equal(root.get("targetOrgId"), criteria.getTargetOrgId()));
            }

            if (criteria.getManageScopeType() != null) {
                predicates.add(cb.equal(root.get("manageScopeType"), criteria.getManageScopeType()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void validateManagementPermission(UUID targetOrgId) {
        User currentUser = getCurrentUser();
        OrganizationProfile targetOrg = organizationRepository.findById(targetOrgId)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.ORG_NOT_FOUND));

        if (!Constants.ADMIN_USERNAME.equals(currentUser.getUsername())) {
            if (!scopeHelper.hasManagementPermission(currentUser, targetOrg)) {
                throw new AccessDeniedException(Constants.ErrorCode.ACCESS_DENIED,
                        Constants.MessageKey.ACCESS_DENIED_ORG_NO_PERMISSION,
                        Constants.ErrorMessage.ACCESS_DENIED_ORG_NO_PERMISSION);
            }
        }
    }
}
