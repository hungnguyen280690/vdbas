package com.fis.vdbas.exp.api.category;

import com.fis.vdbas.exp.application.category.dto.CategoryGroupDto;
import com.fis.vdbas.exp.application.category.dto.CategoryGroupSearchDto;
import com.fis.vdbas.exp.application.category.service.CategoryGroupService;
import com.fis.vdbas.common.dto.PageResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/category-groups")
@RequiredArgsConstructor
public class CategoryGroupController {

    private final CategoryGroupService service;

    /**
     * GET /api/category-groups
     * Returns all active (non-deleted) groups ordered by orderIndex.
     * Result is cached — suitable for dropdown/lookup usage.
     */
    @GetMapping
    public List<CategoryGroupDto> findAll() {
        return service.findAll();
    }

    /**
     * GET /api/category-groups/{code}
     */
    @GetMapping("/{code}")
    public CategoryGroupDto get(@PathVariable String code) {
        return service.get(code);
    }



    /**
     * POST /api/category-groups/search
     * Paginated + filtered search. Accepts JSON body for rich filter criteria.
     */
    @PostMapping("/search")
    public PageResponseDto<CategoryGroupDto> search(@RequestBody CategoryGroupSearchDto body) {
        return service.search(body);
    }

    /**
     * POST /api/category-groups  →  201 Created
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryGroupDto create(@Valid @RequestBody CategoryGroupDto body) {
        return service.create(body);
    }

    /**
     * PUT /api/category-groups/{code}  →  200 OK
     */
    @PutMapping("/{code}")
    public CategoryGroupDto update(@PathVariable String code, @Valid @RequestBody CategoryGroupDto body) {
        return service.update(code, body);
    }

    /**
     * DELETE /api/category-groups/{code}  →  204 No Content
     * Soft-deletes the group and all its category items.
     */
    @DeleteMapping("/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String code) {
        service.delete(code);
    }
}
