import {tableFeatures,rowSortingFeature,rowPaginationFeature,createSortedRowModel,createPaginatedRowModel} from "@tanstack/react-table";
export const stockFeatures=tableFeatures({rowSortingFeature,rowPaginationFeature,sortedRowModel:createSortedRowModel(),paginatedRowModel:createPaginatedRowModel()});
export type StockFeatures=typeof stockFeatures;
