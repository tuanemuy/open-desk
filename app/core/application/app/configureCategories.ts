import { AppCategory } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import type { CategoryId as CategoryIdType } from "@/core/domain/app/valueObject";
import { AppId, AppStatus, Revision } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ConfigureCategoriesOutput } from "./dto";

export type CategoryNodeInput = {
  categoryId: string | null;
  name: string;
  children: CategoryNodeInput[];
};

export type ConfigureCategoriesInput = {
  appId: string;
  isEnabled: boolean;
  categories: CategoryNodeInput[];
  revision: number;
  modifierId: string;
};

export async function configureCategories({
  container,
  input,
}: ServiceArgs<ConfigureCategoriesInput>): Promise<ConfigureCategoriesOutput> {
  const appId = AppId.create(input.appId);
  const expectedRevision = Revision.create(input.revision);
  const _modifierId = UserId.create(input.modifierId);

  return await container.unitOfWorkProvider.transaction(async (repos) => {
    const app = await repos.appRepository.findById(appId);
    if (app === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `App ${input.appId} not found`,
      );
    }
    if (AppStatus.isDeleted(app.status)) {
      throw new BusinessRuleError(
        AppErrorCode.DeletedAppModification,
        "Cannot modify a deleted app",
      );
    }

    let category = await repos.appCategoryRepository.findByAppId(appId);
    if (category === null) {
      category = AppCategory.create({ appId });
    } else {
      if (category.revision !== expectedRevision) {
        throw new BusinessRuleError(
          AppErrorCode.RevisionConflict,
          `Revision conflict: expected ${expectedRevision}, got ${category.revision}`,
        );
      }
    }

    if (input.isEnabled) {
      category = AppCategory.enable(category);

      // Rebuild categories from input tree
      // First, collect existing category IDs
      const _existingIds = collectCategoryIds(category.categories);

      // Clear existing categories and rebuild from input
      category = { ...category, categories: [] };

      for (const nodeInput of input.categories) {
        category = buildCategoryTree(category, nodeInput, null);
      }
    } else {
      category = AppCategory.disable(category);
    }

    // Increment revision
    category = {
      ...category,
      revision: Revision.increment(category.revision),
    };

    await repos.appCategoryRepository.save(category);

    return {
      appId: category.appId,
      isEnabled: category.isEnabled,
      categories: [...category.categories],
      revision: category.revision,
    };
  });
}

function collectCategoryIds(
  nodes: readonly {
    categoryId: CategoryIdType;
    children: readonly { categoryId: CategoryIdType }[];
  }[],
): Set<string> {
  const ids = new Set<string>();
  for (const node of nodes) {
    ids.add(node.categoryId);
    const childIds = collectCategoryIds(node.children as typeof nodes);
    for (const id of childIds) {
      ids.add(id);
    }
  }
  return ids;
}

function buildCategoryTree(
  category: ReturnType<typeof AppCategory.create>,
  nodeInput: CategoryNodeInput,
  parentId: CategoryIdType | null,
): typeof category {
  const { appCategory, newCategoryId } = AppCategory.addCategory(
    category,
    nodeInput.name,
    parentId,
  );
  let result = appCategory;
  for (const child of nodeInput.children) {
    result = buildCategoryTree(result, child, newCategoryId);
  }
  return result;
}
