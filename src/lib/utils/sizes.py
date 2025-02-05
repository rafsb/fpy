# --------------------------------------------------------------------------------------------
# Sizes module for guessing the size of a SKU based on its code. The module provides a function
# to guess the size of a SKU and another function to normalize the size of a SKU.
# --------------------------------------------------------------------------------------------
# Author: Rafael Bertolini
# --------------------------------------------------------------------------------------------

import re


def guess(sku) :
    ini_let     = sku[:1].upper()
    fin_let3    = sku[-3:].upper()
    fin_let4    = sku[-4:].upper()
    med_let     = sku[-3:][:2].upper()
    res         = 'Unknown'
    match ini_let :
        case 'E':
            if sku[:3].upper() == 'E19': res = 'tampa'
            else: res = 'tampa'
        case 'T': res = 'tampa'
        case '6': res = 'shell'
        case 'C':
            # CAABQDR-24-014F90
            match fin_let3:
                case '55S': res = '12ozsleek'
                case 'B40': res = '12ozsleek'
                case 'B4S': res = '12ozsleek'
                case 'B4X': res = '12ozsleek'
                case 'B4D': res = '12ozsleek'
                case '50S': res = '12oz'
                case 'C40': res = '12oz'
                case 'C4S': res = '12oz'
                case '50X': res = '16oz'
                case '73S': res = '16oz'
                case 'C50': res = '16oz'
                case 'C5D': res = '16oz'
                case 'C5S': res = '16oz'
                case 'C5X': res = '16oz'
                case '70X': res = '24oz'
                case 'C7S': res = '24oz'
                case 'C70': res = '24oz'
                case 'B80': res = '75oz'
                case 'A20': res = '84oz'
                case '20X': res = '91oz'
                case 'B20': res = '91oz'
                case 'B2D': res = '91oz'
                case '69S': res = '91oz'
                case 'B2S': res = '91oz'
                case 'B2X': res = '91oz'
                case 'B30': res = '105oz'
                case 'B3S': res = '105oz'
            match fin_let4:
                case '710S': res = '24oz'
                case '310S': res = '105oz'
                case '410S': res = '139oz'
                case '410S': res = '139oz'
            match med_let:
                case 'F9': res = '139oz'
    return res


def normalize(weird_size):
    return re.sub(r"[^0-9a-z]", "", weird_size.strip().lower())
