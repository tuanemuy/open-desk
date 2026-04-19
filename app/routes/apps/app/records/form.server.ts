import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { AppId } from "@/core/domain/app/valueObject";
import type { SpaceId } from "@/core/domain/space/valueObject";
import type { RankOption, RecordFormAppInfo } from "./form";

type FieldDefinition = {
  fieldCode: string;
  properties: {
    type: string;
    options?: readonly {
      label: string;
    }[];
  };
};

export async function loadRecordFormBaseData(appId: string): Promise<{
  app: RecordFormAppInfo;
  rankOptions: RankOption[];
}> {
  const { appEntity, fields } = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      const found = await ctx.appRepository.findById(AppId.create(appId));
      const fieldList = await ctx.fieldRepository.findByAppId(
        AppId.create(appId),
      );
      return {
        appEntity: found,
        fields: fieldList as readonly FieldDefinition[],
      };
    },
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

  const rankOptions: RankOption[] = [{ value: "", label: "-----" }];
  for (const field of fields) {
    if (
      field.properties.type === "DROP_DOWN" &&
      field.fieldCode === "customer_rank"
    ) {
      for (const option of field.properties.options ?? []) {
        rankOptions.push({ value: option.label, label: option.label });
      }
    }
  }

  return {
    app: {
      id: appEntity.appId as string,
      name: appEntity.name as string,
      spaceName,
      spaceId: (appEntity.spaceId as string) ?? "",
    },
    rankOptions,
  };
}
