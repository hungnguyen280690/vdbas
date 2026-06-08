package com.fis.vdbas.qtdc.application.auth.servcie;

import com.fis.vdbas.qtdc.application.auth.dto.RoleDto;
import com.fis.vdbas.qtdc.application.auth.dto.RoleSearchDto;
import com.fis.vdbas.qtdc.application.auth.mapper.RoleMapper;
import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.qtdc.domain.auth.Role;
import com.fis.vdbas.qtdc.domain.auth.RoleId;
import com.fis.vdbas.qtdc.domain.auth.RoleRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.jpa.domain.Specification;
import com.fis.vdbas.qtdc.common.CacheConstants;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;

/**
 * Service for processing business logic related to Roles.
 * <p>
 * Allows retrieving, searching, creating, updating, and soft-deleting roles
 * per application code (appCode). Integrates cache eviction mechanism (CacheEvict)
 * when roles change to ensure user permissions are refreshed.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RoleService {

    private final RoleRepository repository;
    private final RoleMapper mapper;

    /**
     * Retrieves all roles belonging to an application.
     *
     * @param appCode Application code to retrieve
     * @return List of roles as DTOs
     */
    public List<RoleDto> getAll(String appCode) {
        return mapper.toDtoList(repository.findAllByAppCode(appCode));
    }

    /**
     * Searches for roles with pagination based on filter criteria.
     *
     * @param criteria Filter containing parameters such as role name, application code, pagination
     * @return Paginated list of roles
     */
    public PageResponseDto<RoleDto> search(RoleSearchDto criteria) {

        String sortBy = (criteria.getSortBy() != null && !criteria.getSortBy().isBlank())
                ? criteria.getSortBy()
                : "roleCode";
        Direction direction = "desc".equalsIgnoreCase(criteria.getSortDirection())
                ? Direction.DESC
                : Direction.ASC;

        Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(), Sort.by(direction, sortBy));
        Page<Role> page = repository.findAll(this.filter(criteria), pageable);

        PageResponseDto<RoleDto> response = PageResponseDto.<RoleDto>builder()
                .content(mapper.toDtoList(page.getContent()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
        return response;
    }

    /**
     * Retrieves detailed information for a specific role.
     *
     * @param appCode  Application code
     * @param roleCode Role code
     * @return DTO containing role information, throws an error if not found
     */
    public RoleDto get(String appCode, String roleCode) {
        RoleId id = new RoleId();
        id.setAppCode(appCode);
        id.setRoleCode(roleCode);
        return mapper.toDto(repository.findById(id).orElseThrow());
    }

    /**
     * Creates a new role for an application.
     *
     * @param input Role information to be created
     * @return Role created and saved in the database
     */
    @Transactional
    public RoleDto create(RoleDto input) {
        Role entity = mapper.toEntity(input);
        return mapper.toDto(repository.save(entity));
    }

    /**
     * Updates an existing role's information.
     * <p>
     * This operation will automatically evict the user permissions cache ({@code USER_PERMISSIONS_CACHE}).
     * </p>
     *
     * @param appCode  Application code
     * @param roleCode Role code to be updated
     * @param input    New role data
     * @return Updated role information
     */
    @Transactional
    @CacheEvict(value = CacheConstants.USER_PERMISSIONS_CACHE, allEntries = true)
    public RoleDto update(String appCode, String roleCode, RoleDto input) {
        RoleId id = new RoleId();
        id.setAppCode(appCode);
        id.setRoleCode(roleCode);

        Role existing = repository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted())).orElseThrow();
        mapper.updateEntityFromDto(input, existing);

        return mapper.toDto(repository.save(existing));
    }

    /**
     * Performs a soft-delete on a role from the system.
     * <p>
     * Updates the deleted flag to true instead of completely removing from the database.
     * Automatically refreshes the user permissions cache ({@code USER_PERMISSIONS_CACHE}).
     * </p>
     *
     * @param appCode  Application code
     * @param roleCode Role code to be deleted
     */
    @Transactional
    @CacheEvict(value = CacheConstants.USER_PERMISSIONS_CACHE, allEntries = true)
    public void delete(String appCode, String roleCode) {
        RoleId id = new RoleId();
        id.setAppCode(appCode);
        id.setRoleCode(roleCode);
        Role existing = repository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted())).orElseThrow();
        repository.softDelete(appCode, roleCode);
    }

    private Specification<Role> filter(RoleSearchDto criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getRoleCode() != null && !criteria.getRoleCode().isBlank()) {
                predicates.add(
                        cb.like(cb.lower(root.get("roleCode")), "%" + criteria.getRoleCode().toLowerCase() + "%"));
            }

            if (criteria.getRoleName() != null && !criteria.getRoleName().isBlank()) {
                predicates.add(
                        cb.like(cb.lower(root.get("roleName")), "%" + criteria.getRoleName().toLowerCase() + "%"));
            }

            if (criteria.getAppCode() != null && !criteria.getAppCode().isBlank()) {
                predicates.add(
                        cb.like(cb.lower(root.get("appCode")), "%" + criteria.getAppCode().toLowerCase() + "%"));
            }

            if (criteria.getDeleted() != null) {
                predicates.add(cb.equal(root.get("deleted"), mapper.booleanToInteger(criteria.getDeleted())));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
