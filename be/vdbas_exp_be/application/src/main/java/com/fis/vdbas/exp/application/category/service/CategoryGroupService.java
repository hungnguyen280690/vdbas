package com.fis.vdbas.exp.application.category.service;

import com.fis.vdbas.exp.application.category.dto.CategoryGroupDto;
import com.fis.vdbas.exp.application.category.dto.CategoryGroupSearchDto;
import com.fis.vdbas.exp.application.category.mapper.CategoryGroupMapper;
import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.common.exception.DuplicateResourceException;
import com.fis.vdbas.common.exception.InvalidOperationException;
import com.fis.vdbas.common.exception.ResourceNotFoundException;
import com.fis.vdbas.exp.common.CacheConstants;
import com.fis.vdbas.exp.common.Constants;
import com.fis.vdbas.exp.domain.category.CategoryGroup;
import com.fis.vdbas.exp.domain.category.CategoryGroupRepository;
import com.fis.vdbas.exp.domain.category.CategoryRepository;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;
import static com.fis.vdbas.common.util.Constants.FLAG_TRUE;

/**
 * Service for managing Category Groups.
 * <p>
 * Handles business logic for grouping category items, including search,
 * validation of system groups, and cascading soft-deletion of associated categories.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CategoryGroupService {

    private final CategoryGroupRepository repository;
    private final CategoryRepository categoryRepository;
    private final CategoryGroupMapper mapper;



    /**
     * Retrieves all category groups.
     *
     * @return List of category group DTOs
     */
    public List<CategoryGroupDto> findAll() {
        return mapper.toDtoList(repository.findByDeletedOrderByGroupCodeAsc(FLAG_FALSE));
    }

    /**
     * Searches for category groups with pagination and filtering.
     *
     * @param criteria Search parameters
     * @return Paginated response of category group DTOs
     */
    public PageResponseDto<CategoryGroupDto> search(CategoryGroupSearchDto criteria) {
        String sortBy = (criteria.getSortBy() != null && !criteria.getSortBy().isBlank())
                ? criteria.getSortBy()
                : "groupCode";
        Direction direction = "desc".equalsIgnoreCase(criteria.getSortDirection())
                ? Direction.DESC
                : Direction.ASC;

        Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(), Sort.by(direction, sortBy));
        Page<CategoryGroup> page = repository.findAll(this.filter(criteria), pageable);

        return PageResponseDto.<CategoryGroupDto>builder()
                .content(mapper.toDtoList(page.getContent()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    /**
     * Retrieves a specific category group by its unique code.
     *
     * @param groupCode Group identifier code
     * @return Category group DTO
     */
    public CategoryGroupDto get(String groupCode) {
        CategoryGroup entity = repository.findById(groupCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.ErrorCode.CATEGORY_GROUP_NOT_FOUND,
                        Constants.MessageKey.CATEGORY_GROUP_NOT_FOUND,
                        Constants.Resource.CATEGORY_GROUP,
                        "groupCode",
                        groupCode));
        return mapper.toDto(entity);
    }

    /**
     * Creates a new category group.
     * <p>
     * Validates that the group code is unique before saving.
     * </p>
     *
     * @param input Group data
     * @return The created group DTO
     */
    @Transactional
    public CategoryGroupDto create(CategoryGroupDto input) {
        // Check if groupCode already exists
        if (repository.existsById(input.getGroupCode())) {
            throw new DuplicateResourceException(
                    Constants.ErrorCode.CATEGORY_GROUP_CODE_DUPLICATE,
                    Constants.MessageKey.CATEGORY_GROUP_CODE_DUPLICATE,
                    Constants.Resource.CATEGORY_GROUP,
                    "groupCode",
                    input.getGroupCode());
        }

        CategoryGroup entity = mapper.toEntity(input);
        return mapper.toDto(repository.save(entity));
    }

    /**
     * Updates an existing category group.
     *
     * @param groupCode Group identifier code
     * @param input     Updated group data
     * @return The updated group DTO
     */
    @Transactional
    public CategoryGroupDto update(String groupCode, CategoryGroupDto input) {
        CategoryGroup existing = repository.findByGroupCodeAndDeleted(groupCode, FLAG_FALSE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.ErrorCode.CATEGORY_GROUP_NOT_FOUND,
                        Constants.MessageKey.CATEGORY_GROUP_NOT_FOUND,
                        Constants.Resource.CATEGORY_GROUP,
                        "groupCode",
                        groupCode));

        mapper.updateEntityFromDto(input, existing);
        return mapper.toDto(repository.save(existing));
    }

    /**
     * Toggles the active status of a category group.
     *
     * @param groupCode Group identifier code
     * @param active    New active status
     * @return The updated group DTO
     */
    @Transactional
    public CategoryGroupDto updateActive(String groupCode, Boolean active) {
        CategoryGroup existing = repository.findByGroupCodeAndDeleted(groupCode, FLAG_FALSE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.ErrorCode.CATEGORY_GROUP_NOT_FOUND,
                        Constants.MessageKey.CATEGORY_GROUP_NOT_FOUND,
                        Constants.Resource.CATEGORY_GROUP,
                        "groupCode",
                        groupCode));

        repository.updateActive(groupCode, mapper.booleanToInteger(active));
        existing.setActive(mapper.booleanToInteger(active));
        return mapper.toDto(existing);
    }

    /**
     * Soft-deletes a category group and its associated categories.
     * <p>
     * Prevents deletion of groups marked as system-critical.
     * </p>
     *
     * @param code Group identifier code
     */
    @Transactional
    public void delete(String code) {
        CategoryGroup existing = repository.findByGroupCodeAndDeleted(code, FLAG_FALSE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.ErrorCode.CATEGORY_GROUP_NOT_FOUND,
                        Constants.MessageKey.CATEGORY_GROUP_NOT_FOUND,
                        Constants.Resource.CATEGORY_GROUP,
                        "groupCode",
                        code));

        if (FLAG_TRUE.equals(existing.getSystem())) {
            throw new InvalidOperationException(
                    Constants.ErrorCode.CATEGORY_GROUP_CANNOT_DELETE_SYSTEM,
                    Constants.MessageKey.CATEGORY_GROUP_SYSTEM,
                    "System category group cannot be deleted");
        }

        // Cascading delete categories
        categoryRepository.softDeleteByGroupCode(code);
        repository.softDelete(code);
    }

    private Specification<CategoryGroup> filter(CategoryGroupSearchDto criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getGroupCode() != null && !criteria.getGroupCode().isBlank()) {
                // predicates.add(cb.equal(root.get("groupCode"), criteria.getGroupCode()));
                predicates.add(
                        cb.like(cb.lower(root.get("groupCode")), "%" + criteria.getGroupCode().toLowerCase() + "%"));
            }

            if (criteria.getGroupName() != null && !criteria.getGroupName().isBlank()) {
                predicates.add(
                        cb.like(cb.lower(root.get("groupName")), "%" + criteria.getGroupName().toLowerCase() + "%"));
            }

            if (criteria.getActive() != null) {
                predicates.add(cb.equal(root.get("active"), mapper.booleanToInteger(criteria.getActive())));
            }

            if (criteria.getSystem() != null) {
                predicates.add(cb.equal(root.get("system"), mapper.booleanToInteger(criteria.getSystem())));
            }

            if (criteria.getDeleted() != null) {
                predicates.add(cb.equal(root.get("deleted"), mapper.booleanToInteger(criteria.getDeleted())));
            } else {
                predicates.add(cb.equal(root.get("deleted"), FLAG_FALSE));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
