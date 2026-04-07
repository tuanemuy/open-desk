import { createHash, randomBytes } from "node:crypto";
import { ApiTokenConfig } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import type { ApiScope } from "@/core/domain/app/valueObject";
import { ApiTokenId, AppId, AppStatus } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ManageApiTokenOutput } from "./dto";

const MAX_TOKENS_PER_APP = 20;

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type ManageApiTokenInput = {
  appId: string;
  tokenId: string | null;
  scopes: ApiScope[];
  memo: string;
  regenerate: boolean;
  executorId: string;
};

export async function manageApiToken({
  container,
  input,
}: ServiceArgs<ManageApiTokenInput>): Promise<ManageApiTokenOutput> {
  const appId = AppId.create(input.appId);
  const _executorId = UserId.create(input.executorId);

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

    let apiToken: ReturnType<typeof ApiTokenConfig.create>;
    let rawToken: string | null = null;

    if (input.tokenId === null) {
      // Create new token
      const tokenCount =
        await repos.apiTokenConfigRepository.countByAppId(appId);
      if (tokenCount >= MAX_TOKENS_PER_APP) {
        throw new BusinessRuleError(
          AppErrorCode.EmptyApiScopes,
          `Cannot create more than ${MAX_TOKENS_PER_APP} API tokens per app`,
        );
      }
      rawToken = generateToken();
      apiToken = ApiTokenConfig.create({
        appId,
        tokenHash: hashToken(rawToken),
        scopes: input.scopes,
        memo: input.memo,
      });
    } else {
      // Update existing token
      const tokenId = ApiTokenId.create(input.tokenId);
      const existing = await repos.apiTokenConfigRepository.findById(tokenId);
      if (existing === null) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          `API token ${input.tokenId} not found`,
        );
      }
      apiToken = ApiTokenConfig.updateScopes(existing, input.scopes);
      apiToken = ApiTokenConfig.updateMemo(apiToken, input.memo);

      if (input.regenerate) {
        rawToken = generateToken();
        apiToken = ApiTokenConfig.regenerate(apiToken, hashToken(rawToken));
      }
    }

    await repos.apiTokenConfigRepository.save(apiToken);

    return {
      tokenId: apiToken.tokenId,
      token: rawToken,
      scopes: [...apiToken.scopes],
      memo: apiToken.memo,
    };
  });
}
