import { useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';

import {
  MarketFilters,
  MARKET_FILTER_LABELS,
  type MarketData,
  MARKETS_TO_DISPLAY,
} from '@/constants/markets';

import { testFlags } from '@/lib/testFlags';

import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { isTruthy } from '@/lib/isTruthy';

const filterFunctions = {
  [MarketFilters.ALL]: () => true,
  [MarketFilters.LAYER_1]: (market: MarketData) => {
    return market.asset.tags?.toArray().includes('Layer 1');
  },
  [MarketFilters.DEFI]: (market: MarketData) => {
    return market.asset.tags?.toArray().includes('Defi');
  },
};

export const useMarketsData = (
  filter: MarketFilters = MarketFilters.ALL,
  searchFilter?: string
): {
  markets: MarketData[];
  filteredMarkets: MarketData[];
  marketFilters: string[];
} => {
  const allPerpetualMarkets = useSelector(getPerpetualMarkets, shallowEqual) || {};
  const allAssets = useSelector(getAssets, shallowEqual) || {};

  const markets = useMemo(() => {
    return Object.values(allPerpetualMarkets)
      .filter(isTruthy)
      .map((marketData) => ({
        asset: allAssets[marketData.assetId],
        tickSizeDecimals: marketData.configs?.tickSizeDecimals,
        ...marketData,
        ...marketData.perpetual,
        ...marketData.configs,
      })) as MarketData[];
  }, [allPerpetualMarkets, allAssets]);

  const filteredMarkets = useMemo(() => {
    const filtered = markets
      .filter(filterFunctions[filter])
      .filter(({ id }) => (testFlags.displayAllMarkets ? true : MARKETS_TO_DISPLAY.includes(id)));

    if (searchFilter) {
      return filtered.filter(
        ({ asset }) =>
          asset?.name?.toLocaleLowerCase().includes(searchFilter.toLowerCase()) ||
          asset?.id?.toLocaleLowerCase().includes(searchFilter.toLowerCase())
      );
    }
    return filtered;
  }, [markets, searchFilter, filter]);

  const marketFilters = useMemo(
    () => [
      MarketFilters.ALL,
      ...Object.keys(MARKET_FILTER_LABELS).filter((marketFilter) =>
        markets.some((market) => market.asset?.tags?.toArray().some((tag) => tag === marketFilter))
      ),
    ],
    [markets]
  );

  return { marketFilters, filteredMarkets, markets };
};
