import { data } from "react-router";
import { isStubNotImplementedError } from "@/core/adapters/stub/error";
import { container } from "@/core/application/container/server.instance";
import { queryRecords } from "@/core/application/record/queryRecords";
import { AppId } from "@/core/domain/app/valueObject";
import type { SpaceId } from "@/core/domain/space/valueObject";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type RecordItem = {
  id: string;
  recordNo: number;
  company: string;
  department: string;
  person: string;
  address: string;
};

type ViewOption = {
  id: string;
  name: string;
};

type AppInfo = {
  id: string;
  name: string;
  spaceName: string;
  spaceId: string;
};

export type AppDetailLoaderData = {
  app: AppInfo;
  records: RecordItem[];
  views: ViewOption[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
};

export async function loader({
  params,
  request,
}: Route.LoaderArgs): Promise<AppDetailLoaderData> {
  const auth = await requireAuth(request, container);

  const appId = params.appId;
  const pageSize = 10;
  const currentPage = 1;

  const appEntity = await container.unitOfWorkProvider.transaction(
    async (ctx) => ctx.appRepository.findById(AppId.create(appId)),
  );
  if (!appEntity) {
    throw data({ message: "App not found" }, { status: 404 });
  }

  let spaceName = "";
  if (appEntity.spaceId) {
    const space = await container.unitOfWorkProvider.transaction(async (ctx) =>
      ctx.spaceRepository.findById(appEntity.spaceId as unknown as SpaceId),
    );
    if (space) {
      spaceName = space.name as string;
    }
  }

  const app: AppInfo = {
    id: appEntity.appId as string,
    name: appEntity.name as string,
    spaceName,
    spaceId: (appEntity.spaceId as string) ?? "",
  };

  let records: RecordItem[] = [];
  let totalCount = 0;
  try {
    const queryResult = await queryRecords({
      container,
      headers: request.headers,
      input: {
        appId,
        totalCount: true,
        executionContext: {
          loginUserId: auth.userId as string,
          loginUserCode: auth.user.loginName as string,
          primaryOrganizationCode:
            (auth.user.primaryOrganizationId as string) ?? null,
          now: new Date(),
        },
      },
    });
    totalCount = queryResult.totalCount ?? 0;
    records = queryResult.records.map((r, index) => {
      const fv = r.fieldValues;
      const getText = (code: string): string => {
        for (const [key, val] of fv) {
          if ((key as string) === code && "value" in val) {
            return String(val.value);
          }
        }
        return "";
      };
      return {
        id: r.recordId as string,
        recordNo: index + 1,
        company: getText("company_name"),
        department: getText("department"),
        person: getText("contact_name"),
        address: getText("address"),
      };
    });
  } catch (e) {
    // RecordQueryService is currently a stub adapter that has no real implementation.
    // This fallback returns empty results until the adapter is fully implemented.
    // Remove this catch block once RecordQueryService is replaced with a real adapter.
    if (isStubNotImplementedError(e)) {
      records = [];
      totalCount = 0;
    } else {
      throw e;
    }
  }

  const views = await container.unitOfWorkProvider.transaction(async (ctx) => {
    const viewEntities = await ctx.viewRepository.findByAppId(
      AppId.create(appId),
    );
    return viewEntities.map(
      (v): ViewOption => ({
        id: v.viewId as string,
        name: v.viewName,
      }),
    );
  });

  return {
    app,
    records,
    views,
    totalCount,
    currentPage,
    pageSize,
  };
}
