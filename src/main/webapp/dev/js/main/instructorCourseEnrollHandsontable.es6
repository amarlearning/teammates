/* global Handsontable:false */

import {
    ParamsNames,
} from '../common/const.es6';

/**
 * @Global Variables
 */
const container = document.getElementById('spreadsheet');
const columns = ['Section', 'Team', 'Name', 'Email', 'Comments (Optional)'];

/**
 * Validator Function to validation emails
 * @param {string} value
 * @param {function} callback
 *
 * @return {function} true/false
 */
const emailValidator = (value, callback) => {
    setTimeout(() => {
        if (/.+@.+/.test(value)) {
            callback(true);
        } else {
            callback(false);
        }
    }, 100);
};

/**
 * Holds Handsontable settings, reference and other information for Spreadsheet.
 */
const handsontable = new Handsontable(container, {
    rowHeaders: true,
    colHeaders: columns,
    columnSorting: true,
    className: 'htCenter',
    manualColumnResize: true,
    sortIndicator: true,
    maxCols: 5,
    stretchH: 'all',
    minSpareRows: 2,
    manualColumnMove: true,
    contextMenu: [
        'row_above',
        'row_below',
        'remove_row',
        'undo',
        'redo',
        'make_read_only',
        'alignment',
    ],
    columns: [
        {
            type: 'text',
        }, {
            type: 'text',
        }, {
            type: 'text',
        }, {
            validator: emailValidator,
            allowInvalid: false,
        }, {
            type: 'text',
        },
    ],
});

/**
 * Removes ' (Optional)' string from an array of string
 * @param {array of string} columns
 * @return {array of string} columns
 */
function removeOptionalWord(columnsList) {
    for (let itr = 0; itr < columnsList.length; itr += 1) {
        columnsList[itr] = columnsList[itr].replace(' (Optional)', '');
    }
    return columnsList;
}

/**
 * Updates column header order and generates a header string.
 *
 * Example: Change this array ['Section', 'Team', 'Name', 'Email', 'Comments']
 * into a string = "Section | Team | Name | Email | Comments"
 */
function updateHeaderOrder() {
    let headerString = '';
    const colHeader = removeOptionalWord(handsontable.getColHeader());
    for (let itr = 0; itr < colHeader.length; itr += 1) {
        headerString += colHeader[itr];
        if (itr < colHeader.length - 1) {
            headerString += ' | ';
        }
    }
    headerString += '\n';
    return headerString;
}

/**
 * Updates the Student data from the spreadsheet when any of the
 * following event occurs afterChange, afterColumnMove or afterRemoveRow.
 *
 * Push the output data into the textarea (used for form submission).
 *
 * Handles the width of column and height of row in case of overflow.
 */
function updateDataDump() {
    const spreadsheetData = handsontable.getData();
    let dataPushToTextarea = updateHeaderOrder();
    let countEmptyColumns = 0;
    let rowData = '';
    for (let row = 0; row < spreadsheetData.length; row += 1) {
        countEmptyColumns = 0; rowData = '';
        for (let col = 0; col < spreadsheetData[row].length; col += 1) {
            rowData += spreadsheetData[row][col] !== null ? spreadsheetData[row][col] : '';
            if ((spreadsheetData[row][col] === '' || spreadsheetData[row][col] === null)
             && col < spreadsheetData[row].length - 1) {
                countEmptyColumns += 1;
            }
            if (col < spreadsheetData[row].length - 1) {
                rowData += ' | ';
            }
        }
        if (countEmptyColumns < spreadsheetData[row].length - 1) {
            dataPushToTextarea += rowData;
            dataPushToTextarea += '\n';
        }
    }

    $('#enrollstudents').text(dataPushToTextarea);

    /* eslint-disable consistent-return */
    handsontable.updateSettings({
        modifyColWidth: (width) => {
            if (width > 165) {
                return 150;
            }
        },
        modifyRowHeight: (height) => {
            if (height > 20) {
                return 10;
            }
        },
    });
    /* eslint-enable consistent-return */
}

/**
 * Adds the listener to specified hook name and only for this Handsontable instance.
 */
function addHandsontableHooks() {
    const hooks = ['afterChange', 'afterColumnMove', 'afterRemoveRow'];

    for (let itr = 0; itr < hooks.length; itr += 1) {
        handsontable.addHook(hooks[itr], updateDataDump);
    }
}

/**
 * Fetch all students enrolled in a particular course
 *
 * @param {string} COURSE_ID
 * @param {string} USER
 *
 * Returns the list of all students data object and push them
 * in the spreadsheet.
 */
function fetchStudentList() {
    const $form = $('#enrollSubmitForm');
    const COURSE_ID = $form.children(`input[name="${ParamsNames.COURSE_ID}"]`).val();
    const USER = $form.children(`input[name="${ParamsNames.USER_ID}"]`).val();

    $.ajax({
        type: 'POST',
        cache: false,
        url: '/page/instructorCourseStudentList',
        data: {
            courseid: COURSE_ID,
            user: USER,
        },
        beforeSend() {
            $('#statusBox').html('<img src=\'/images/ajax-loader.gif\'/>');
        },
        error() {
            $('#statusBox').html('<button id=\'retryFetchingList\' type=\'button\''
                                + ' class=\'btn btn-danger btn-xs\'>An Error Occurred, Please Retry</button>');
        },
        success(data) {
            $('#statusBox').hide();

            const objects = data.students;
            if (objects.length !== 0) {
                handsontable.updateSettings({
                    data: data.students,
                    columns: [
                        {
                            data: 'section',
                            type: 'text',
                        }, {
                            data: 'team',
                            type: 'text',
                        }, {
                            data: 'name',
                            type: 'text',
                        }, {
                            data: 'email',
                            validator: emailValidator,
                            allowInvalid: false,
                        }, {
                            data: 'comments',
                            type: 'text',
                        },
                    ],
                });
            }
        },
    });
}

$(document).ready(() => {
    fetchStudentList();
    addHandsontableHooks();

    $('#statusBox').on('click', '#retryFetchingList', () => {
        fetchStudentList();
    });

    $('#addEmptyRows').click(() => {
        const emptyRowsCount = $("input[name='number_of_rows']").val();
        handsontable.alter('insert_row', null, emptyRowsCount);
    });
});
