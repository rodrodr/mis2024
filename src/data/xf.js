/**
 * data/xf.js
 * crossfilter2 wrapper for fast client-side filtering.
 * Works on party_national + party_state data.
 */

import crossfilter from 'crossfilter2';

let cf = null;
let yearDim, partyDim, ufDim, ideoDim;

export function initCrossfilter(partyData) {
  cf = crossfilter(partyData);
  yearDim = cf.dimension(d => d.year);
  partyDim = cf.dimension(d => d.party);
  ufDim = cf.dimension(d => d.uf);
  ideoDim = cf.dimension(d => d.ideo_weighted);
  return cf;
}

export function filterYear(year) {
  yearDim.filter(year);
}

export function filterParty(party) {
  if (party == null || party === '') {
    partyDim.filterAll();
  } else {
    partyDim.filter(party);
  }
}

export function filterUF(uf) {
  if (uf == null || uf === 'BR' || uf === '') {
    ufDim.filterAll();
  } else {
    ufDim.filter(uf);
  }
}

export function filterIdeoRange(min, max) {
  ideoDim.filterRange([min, max]);
}

export function getFilteredData() {
  return cf ? yearDim.top(Infinity) : [];
}

export function getPartyNational(year) {
  if (!cf) return [];
  yearDim.filter(year);
  return yearDim.top(Infinity);
}

export function clearFilters() {
  if (cf) {
    yearDim.filterAll();
    partyDim.filterAll();
    ufDim.filterAll();
    ideoDim.filterAll();
  }
}
