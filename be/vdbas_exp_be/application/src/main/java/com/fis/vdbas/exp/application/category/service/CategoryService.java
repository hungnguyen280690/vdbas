package com.fis.vdbas.exp.application.category.service;

import com.fis.vdbas.exp.application.category.dto.CategoryDto;
import com.fis.vdbas.exp.application.category.dto.CategorySearchDto;
import com.fis.vdbas.exp.application.category.dto.CategoryTreeDto;
import com.fis.vdbas.exp.application.category.mapper.CategoryMapper;
import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.common.exception.DuplicateResourceException;
import com.fis.vdbas.common.exception.ResourceNotFoundException;
import com.fis.vdbas.exp.common.CacheConstants;
import com.fis.vdbas.exp.common.Constants;
import com.fis.vdbas.exp.domain.category.Category;
import com.fis.vdbas.exp.domain.category.CategoryRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;
import static com.fis.vdbas.common.util.Constants.FLAG_TRUE;

/**
 * Service for managing individual Category items.
 * <p>
 * Handles the business logic for category retrieval (flat and tree), searching,
 * creation with hierarchy management, and soft-deletion with system constraints.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository repository;
    private final CategoryMapper mapper;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private CategoryService self;

    // ─── Queries ───────────────────────────────────────────────────────────────
    /**
     * Retrieves all categories belonging to a specific group code.
     * <p>
     * Results are filtered to exclude deleted items and are cached for efficiency.
     * </p>
     *
     * @param groupCode Group identifier
     * @return List of category DTOs
     */
    @Cacheable(value = CacheConstants.CATEGORY_CACHE, key = "'group_' + #groupCode")
    public List<CategoryDto> findAllByGroupCode(String groupCode) {
        return mapper.toDtoList(repository.findByGroupCodeAndDeleted(groupCode, FLAG_FALSE));
    }

    /**
     * Retrieves all categories belonging to a specific group code as a tree structure.
     *
     * @param groupCode Group identifier
     * @return List of category tree DTOs
     */
    @Cacheable(value = CacheConstants.CATEGORY_CACHE, key = "'tree_' + #groupCode")
    public List<CategoryTreeDto> findTreeByGroupCode(String groupCode) {
        List<CategoryDto> all = self.findAllByGroupCode(groupCode);
        return buildTree(all);
    }

    /**
     * Searches for categories with pagination and filtering criteria.
     * <p>
     * Results are cached based on the search criteria.
     * </p>
     *
     * @param criteria Search and pagination parameters
     * @return Paginated response containing category DTOs
     */
    @Cacheable(value = CacheConstants.CATEGORY_CACHE, key = "#criteria")
    public PageResponseDto<CategoryDto> search(CategorySearchDto criteria) {
        String sortBy = (criteria.getSortBy() != null && !criteria.getSortBy().isBlank())
                ? criteria.getSortBy()
                : "groupCode";
        Sort.Direction direction = "desc".equalsIgnoreCase(criteria.getSortDirection())
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(), Sort.by(direction, sortBy));
        Page<Category> page = repository.findAll(this.filter(criteria), pageable);

        return PageResponseDto.<CategoryDto>builder()
                .content(mapper.toDtoList(page.getContent()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    /**
     * Retrieves a single category by its ID.
     *
     * @param id Category UUID
     * @return Category details, cached by ID
     */
    @Cacheable(value = CacheConstants.CATEGORY_CACHE, key = "#id")
    public CategoryDto get(UUID id) {
        return mapper.toDto(repository.findById(id).orElseThrow());
    }

    /**
     * Creates a new category item.
     * <p>
     * Automatically calculates the hierarchy level and path if a parent ID is provided.
     * Evicts the category cache on success.
     * </p>
     *
     * @param input Category data
     * @return The created category DTO
     */
    @Transactional
    @CacheEvict(value = CacheConstants.CATEGORY_CACHE, allEntries = true)
    public CategoryDto create(CategoryDto input) {
        if (repository.existsByGroupCodeAndItemCodeAndDeleted(
                input.getGroupCode(), input.getItemCode(), FLAG_FALSE)) {
            throw new DuplicateResourceException(
                    Constants.ErrorCode.CATEGORY_ITEM_CODE_DUPLICATE,
                    Constants.MessageKey.CATEGORY_ITEM_CODE_DUPLICATE,
                    Constants.Resource.CATEGORY,
                    "itemCode",
                    input.getGroupCode() + "/" + input.getItemCode());
        }
        Category entity = mapper.toEntity(input);
        computeHierarchyFields(entity);
        entity = repository.save(entity);
        return mapper.toDto(entity);
    }

    @Transactional
    @CacheEvict(value = CacheConstants.CATEGORY_CACHE, allEntries = true)
    public CategoryDto update(UUID id, CategoryDto input) {
        Category entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.ErrorCode.CATEGORY_NOT_FOUND,
                        Constants.MessageKey.CATEGORY_NOT_FOUND,
                        Constants.Resource.CATEGORY,
                        "id",
                        id.toString()));

        // Check uniqueness only when itemCode changes
        if (!entity.getItemCode().equals(input.getItemCode())
                && repository.existsByGroupCodeAndItemCodeAndDeleted(
                        entity.getGroupCode(), input.getItemCode(), FLAG_FALSE)) {
            throw new DuplicateResourceException(
                    Constants.ErrorCode.CATEGORY_ITEM_CODE_DUPLICATE,
                    Constants.MessageKey.CATEGORY_ITEM_CODE_DUPLICATE,
                    Constants.Resource.CATEGORY,
                    "itemCode",
                    entity.getGroupCode() + "/" + input.getItemCode());
        }

        mapper.updateEntityFromDto(input, entity);
        computeHierarchyFields(entity);
        entity = repository.save(entity);
        return mapper.toDto(entity);
    }

    @Transactional
    @CacheEvict(value = CacheConstants.CATEGORY_CACHE, allEntries = true)
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException(
                    Constants.ErrorCode.CATEGORY_NOT_FOUND,
                    Constants.MessageKey.CATEGORY_NOT_FOUND,
                    Constants.Resource.CATEGORY,
                    "id",
                    id.toString());
        }
        repository.softDelete(id);
    }

    // ─── Private ───────────────────────────────────────────────────────────────

    /**
     * Computes catLevel and catPath from the parent.
     * Must be called before every save (create and update).
     */
    private void computeHierarchyFields(Category entity) {
        if (entity.getParentId() != null) {
            Category parent = repository.findById(entity.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            Constants.ErrorCode.CATEGORY_NOT_FOUND,
                            Constants.MessageKey.CATEGORY_NOT_FOUND,
                            Constants.Resource.CATEGORY,
                            "parentId",
                            entity.getParentId().toString()));
            entity.setCatLevel(parent.getCatLevel() + 1);
            entity.setCatPath(parent.getCatPath() + "/" + entity.getItemCode());
        } else {
            entity.setCatLevel(1);
            entity.setCatPath(entity.getItemCode());
        }
    }

    /**
     * Assembles a flat list returned by the DB into a parent–child tree in O(n).
     * Uses LinkedHashMap to preserve DB ordering within each level.
     */
    private List<CategoryTreeDto> buildTree(List<CategoryDto> all) {
        Map<UUID, CategoryTreeDto> nodeMap = new LinkedHashMap<>();
        for (CategoryDto item : all) {
            nodeMap.put(item.getId(), mapper.toTreeDto(item));
        }

        List<CategoryTreeDto> roots = new ArrayList<>();
        for (CategoryDto item : all) {
            CategoryTreeDto dto = nodeMap.get(item.getId());
            if (item.getParentId() != null && nodeMap.containsKey(item.getParentId())) {
                nodeMap.get(item.getParentId()).getChildren().add(dto);
            } else {
                roots.add(dto);
            }
        }
        return roots;
    }

    private Specification<Category> filter(CategorySearchDto criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getGroupCode() != null && !criteria.getGroupCode().isBlank()) {
                predicates.add(cb.equal(root.get("groupCode"), criteria.getGroupCode()));
            }

            if (criteria.getItemCode() != null && !criteria.getItemCode().isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("itemCode")),
                        "%" + criteria.getItemCode().toLowerCase() + "%"));
            }

            if (criteria.getItemName() != null && !criteria.getItemName().isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("itemName")),
                        "%" + criteria.getItemName().toLowerCase() + "%"));
            }

            if (criteria.getParentId() != null) {
                predicates.add(cb.equal(root.get("parentId"), criteria.getParentId()));
            }

            // Default: exclude deleted records unless caller explicitly requests them
            if (criteria.getDeleted() != null) {
                predicates.add(cb.equal(root.get("deleted"), mapper.booleanToInteger(criteria.getDeleted())));
            } else {
                predicates.add(cb.equal(root.get("deleted"), FLAG_FALSE));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
